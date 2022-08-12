import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { Listener } from '@ethersproject/abstract-provider'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { IntegrationTriggerService } from 'apps/api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { EventAbi } from 'ethereum-types'
import { ethers } from 'ethers'
import { shuffle } from 'lodash'

@Injectable()
export class BlockchainListenerService {
  private logger = new Logger(BlockchainListenerService.name)

  private listeners: { [key: string]: Listener } = {}

  constructor(
    private providerService: ProviderService,
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
    private workflowRunService: WorkflowRunService,
    private runnerService: RunnerService,
    private explorerService: ExplorerService,
  ) {}

  onModuleInit() {
    this.logger.log(`Starting blockchain events listener`)
    this.startBlockchainEventsListener()
  }

  // TODO we need the interval to start listening for new triggers after the server has started.
  //      it could be more efficient if the api notifies when this happens rather than polling every 30 seconds.
  @Interval(30 * 1000)
  async startBlockchainEventsListener() {
    const integration = await this.integrationService.findOne({ key: 'blockchain', version: '1' })
    if (!integration) {
      this.logger.error(`Blockchain integration not found`)
      return
    }

    const integrationTrigger = await this.integrationTriggerService.findOne({
      key: 'newEvent',
      integration: integration.id,
    })
    if (!integrationTrigger) {
      this.logger.error(`newEvent trigger from blockchain integration not found`)
      return
    }

    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: integrationTrigger.id,
      enabled: true,
    })
    const triggersWithoutListener = workflowTriggers.filter((trigger) => !this.listeners[trigger.id])
    const shuffledTriggers = shuffle(triggersWithoutListener)

    for (const workflowTrigger of shuffledTriggers) {
      if (workflowTrigger.inputs?.network && workflowTrigger.inputs?.address && workflowTrigger.inputs?.event) {
        const network = Number(workflowTrigger.inputs.network)
        const address = workflowTrigger.inputs.address as string
        const event = workflowTrigger.inputs.event as string

        const provider = this.providerService.getReadOnlyProvider(network)
        const abi = await this.explorerService.getContractAbi(network, address)
        if (!abi) {
          this.logger.error(`No ABI found for ${address} on chain ${network}`)
          return
        }
        const eventAbi = abi.find((def: EventAbi) => def.type === 'event' && def.name === event) as EventAbi
        const contract = new ethers.Contract(address, abi, provider)
        const filter = contract.filters[event](
          ...eventAbi.inputs.map((input) => (input.indexed ? workflowTrigger.inputs![input.name] : null)),
        )

        this.logger.log(`Starting listener for trigger ${workflowTrigger.id}`)
        this.listeners[workflowTrigger.id] = async (...args) => {
          const log = args.pop()

          const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
          if (!workflow) {
            this.logger.error(`Workflow not found for workflow trigger ${workflowTrigger.id}`)
            return
          }
          const updatedTrigger = await this.workflowTriggerService.findById(workflowTrigger.id)
          if (!updatedTrigger?.enabled) {
            this.logger.log(`Received an event for a disabled trigger ${workflowTrigger.id}`)
            contract.off(filter, this.listeners[workflowTrigger.id])
            delete this.listeners[workflowTrigger.id]
            return
          }
          this.logger.log(`Running workflow ${workflow.id}`)

          const hookOutputs = {
            [workflowTrigger.id]: {
              ...log,
              log: log.args,
            },
          }

          const rootActions = await this.workflowActionService.find({ workflow: workflow.id, isRootAction: true })
          const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
            integration,
            integrationTrigger,
            workflow,
            workflowTrigger,
            rootActions.length > 0,
          )
          void this.runnerService.runWorkflowActions(rootActions, [hookOutputs], workflowRun)
        }

        contract.on(filter, this.listeners[workflowTrigger.id])
      }
    }
  }
}
