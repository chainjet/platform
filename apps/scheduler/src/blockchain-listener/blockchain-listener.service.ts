import { ProviderService } from '@blockchain/blockchain/calls/provider.service'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { Injectable, Logger } from '@nestjs/common'
import { IntegrationTriggerService } from 'apps/api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { EventAbi } from 'ethereum-types'
import { ethers } from 'ethers'

@Injectable()
export class BlockchainListenerService {
  private logger = new Logger(BlockchainListenerService.name)

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
    this.startBlockchainEventsListener()
  }

  async startBlockchainEventsListener() {
    this.logger.log(`Starting blockchain events listener`)

    const integration = await this.integrationService.findOne({ key: 'smart-contract', version: '1' })
    if (!integration) {
      this.logger.error(`Smart-contract integration not found`)
      return
    }

    const integrationTrigger = await this.integrationTriggerService.findOne({
      key: 'newEvent',
      integration: integration.id,
    })
    if (!integrationTrigger) {
      this.logger.error(`newEvent integration trigger from smart-contract not found`)
      return
    }

    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: integrationTrigger.id,
      enabled: true,
    })

    let executed = false

    // TODO randomnize workflowTriggers

    for (const workflowTrigger of workflowTriggers) {
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

        contract.on(filter, async (...args) => {
          if (executed) {
            return
          }
          executed = true

          const log = args.pop()

          const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
          if (!workflow) {
            this.logger.error(`Workflow not found for workflow trigger ${workflowTrigger.id}`)
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
        })
      }
    }
  }
}
