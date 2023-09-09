import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { ObjectId } from 'mongodb'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { Integration } from '../../integrations/entities/integration'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { WorkflowTriggerService } from './workflow-trigger.service'
import { WorkflowUsedIdService } from './workflow-used-id.service'

interface BlockchainEvent {
  triggerId: string
  network: number
  address: string
  eventName: string
  transactionHash: string
  blockNumber: number
  log: { [key: string]: string }
}

@Processor('blockchainEvent')
export class BlockchainConsumer {
  private readonly logger = new Logger(BlockchainConsumer.name)

  private blockchainIntegration: Integration
  private blockchainIntegrationTrigger: IntegrationTrigger

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly runnerService: RunnerService,
    private readonly workflowUsedIdService: WorkflowUsedIdService,
    private readonly explorerService: ExplorerService,
  ) {}

  async onModuleInit() {
    this.blockchainIntegration = (await this.integrationService.findOne({ key: 'blockchain' })) as Integration
    this.blockchainIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.blockchainIntegration._id,
      key: 'newEvent',
    })) as IntegrationTrigger
  }

  @Process()
  async onBlockchainEvent(job: Job<BlockchainEvent>) {
    const data = job.data
    const workflowTrigger = await this.workflowTriggerService.findOne({
      _id: new ObjectId(data.triggerId),
      enabled: true,
      planLimited: { $ne: true },
    })
    if (!workflowTrigger) {
      this.logger.log(`Workflow trigger ${data.triggerId} not found`)
      return
    }
    const workflow = await this.workflowService.findOne({ _id: workflowTrigger.workflow })
    if (!workflow) {
      this.logger.log(`Workflow ${workflowTrigger.workflow} not found`)
      return
    }
    this.logger.log(`Running workflow ${workflowTrigger.workflow} started by transaction ${data.transactionHash}`)
    const outputs = {
      ...data,
      eventName: workflowTrigger.inputs?.event,
      transactionUrl: this.explorerService.getTransactionUrl(data.network, data.transactionHash),
    }
    const hookTriggerOutputs = {
      id: data.transactionHash,
      outputs: {
        [workflowTrigger.id]: outputs,
        trigger: outputs,
      },
    }
    await this.workflowUsedIdService.createOne({
      workflow: workflow._id,
      triggerId: data.transactionHash,
    })
    const rootActions = await this.workflowActionService.find({
      workflow: workflow._id,
      isRootAction: true,
    })
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      this.blockchainIntegration,
      this.blockchainIntegrationTrigger,
      workflow,
      workflowTrigger,
      rootActions.length > 0,
    )
    await this.workflowTriggerService.updateById(workflowTrigger._id, {
      lastId: data.transactionHash,
      lastItem: outputs,
    })
    void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
  }
}
