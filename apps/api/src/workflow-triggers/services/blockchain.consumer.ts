import { assertNever } from '@app/common/utils/typescript.utils'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { ObjectId } from 'mongodb'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { OrderState } from '../../chat/entities/order'
import { OrderService } from '../../chat/services/order.service'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { Integration } from '../../integrations/entities/integration'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowSleepService } from '../../workflow-runs/services/workflow-sleep.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { WorkflowTriggerService } from './workflow-trigger.service'
import { WorkflowUsedIdService } from './workflow-used-id.service'

interface BaseBlockchainEvent {
  network: number
  address: string
  eventName: string
  transactionHash: string
  blockNumber: number
  log: { [key: string]: string }
}

interface TriggerNewEvent extends BaseBlockchainEvent {
  triggerId: string
  type: 'trigger:newEvent'
}

interface OrderNewPayment extends BaseBlockchainEvent {
  orderId: string
  type: 'order:newPayment'
}

type BlockchainEvent = TriggerNewEvent | OrderNewPayment

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
    private readonly workflowSleepService: WorkflowSleepService,
    private readonly explorerService: ExplorerService,
    private readonly orderService: OrderService,
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
    switch (job.data.type) {
      case 'trigger:newEvent':
        await this.processNewEventTrigger(job as Job<TriggerNewEvent>)
        break
      case 'order:newPayment':
        await this.processNewOrderPayment(job as Job<OrderNewPayment>)
        break
      default:
        assertNever(job.data)
    }
  }

  async processNewEventTrigger(job: Job<TriggerNewEvent>) {
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
    try {
      await this.workflowUsedIdService.createOne({
        workflow: workflowTrigger.workflow,
        triggerId: data.transactionHash,
      })
    } catch {
      return // Already processed
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

  async processNewOrderPayment(job: Job<OrderNewPayment>) {
    this.logger.log(`Processing new order payment ${job.data.transactionHash}`)
    const data = job.data

    const order = await this.orderService.findById(data.orderId)
    if (!order) {
      this.logger.log(`Order ${data.orderId} not found`)
      return
    }
    if (order.state !== OrderState.PendingPayment) {
      this.logger.log(`Order ${data.orderId} is not in pending-payment state`)
      return
    }
    await this.orderService.updateOneNative(
      { _id: new ObjectId(order._id) },
      {
        $set: {
          state: OrderState.PendingDelivery,
          txHash: data.transactionHash,
          txNetwork: data.network,
          waitTx: false,
        },
      },
    )
    this.logger.log(`Order ${data.orderId} payment confirmed`)

    // wake up workflows waiting for the payment
    const workflowSleeps = await this.workflowSleepService.find({
      uniqueGroup: `${order.owner.id}-${order.id}`,
    })
    if (!workflowSleeps.length) {
      return
    }

    // clean up
    await this.workflowSleepService.deleteManyNative({
      _id: {
        $in: workflowSleeps.map((workflowSleep) => workflowSleep._id),
      },
    })

    this.logger.log(`Waking up ${workflowSleeps.length} workflows after payment received`)

    const promises = workflowSleeps.map((workflowSleep) => this.runnerService.wakeUpWorkflowRun(workflowSleep))
    await Promise.all(promises)
  }
}
