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
import { WorkflowUsedIdService } from 'apps/api/src/workflow-triggers/services/workflow-used-id.service'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { ContractAbi, EventAbi } from 'ethereum-types'
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
    private workflowUsedIdService: WorkflowUsedIdService,
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
      planLimited: { $ne: true },
      numberOfActions: { $gt: 0 },
    })
    const triggersWithoutListener = workflowTriggers.filter((trigger) => !this.listeners[trigger.id])
    const shuffledTriggers = shuffle(triggersWithoutListener)

    this.logger.log(`Found ${workflowTriggers.length} blockchain triggers`)

    for (const workflowTrigger of shuffledTriggers) {
      if (workflowTrigger.inputs?.network && workflowTrigger.inputs?.address && workflowTrigger.inputs?.event) {
        const network = Number(workflowTrigger.inputs.network)
        const address = workflowTrigger.inputs.address as string
        const event = workflowTrigger.inputs.event as string

        const provider = this.providerService.getReadOnlyProvider(network)

        // get contract abi from trigger inputs or from explorer
        let abi: ContractAbi | null = null
        if (workflowTrigger.inputs.abi) {
          try {
            abi = JSON.parse(workflowTrigger.inputs.abi)
          } catch {
            this.logger.error(`Invalid ABI for ${address} on trigger ${workflowTrigger.id}`)
          }
        } else {
          try {
            abi = await this.explorerService.getContractAbi(network, address)
          } catch {
            this.logger.error(`Invalid ABI for ${address} on trigger ${workflowTrigger.id}`)
          }
        }
        if (!abi) {
          this.logger.error(`No ABI found for ${address} on trigger ${workflowTrigger.id}`)
          continue
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
          this.logger.log(`Running workflow ${workflow.id} started by transaction ${log.transactionHash}`)

          const logArgs = {}
          for (const logKey of Object.keys(log.args)) {
            logArgs[logKey] = log.args[logKey].toString()
          }

          const outputs = {
            ...log,
            eventName: updatedTrigger.inputs?.event,
            log: logArgs,
            transactionUrl: ExplorerService.instance.getTransactionUrl(network, log.transactionHash),
          }
          const hookTriggerOutputs = {
            id: log.transactionHash,
            outputs: {
              [workflowTrigger.id]: outputs,
              trigger: outputs,
            },
          }

          try {
            await this.workflowUsedIdService.createOne({
              workflow: workflowTrigger.workflow,
              triggerId: log.transactionHash,
            })
            const rootActions = await this.workflowActionService.find({ workflow: workflow.id, isRootAction: true })
            const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
              integration,
              integrationTrigger,
              workflow,
              workflowTrigger,
              rootActions.length > 0,
            )
            await this.workflowTriggerService.updateById(workflowTrigger.id, {
              lastId: log.transactionHash,
              lastItem: outputs,
            })
            void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
          } catch (e) {
            this.logger.error(`Error running workflow ${workflow.id}: ${e?.message}`)
          }
        }

        contract.on(filter, this.listeners[workflowTrigger.id])

        contract.on(filter, this.listeners[workflowTrigger.id]).once('error', (error) => {
          this.logger.error(`Listener encountered an error for trigger ${workflowTrigger.id}: ${error.message}`)
        })
      }
    }
  }
}
