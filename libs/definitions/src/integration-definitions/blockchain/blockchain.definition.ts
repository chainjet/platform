import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { blockchainConfigList } from '@blockchain/blockchain/blockchain.config'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { eventsAbiToOutputJsonSchema, methodsAbiToOutputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { EventAbi, MethodAbi } from 'ethereum-types'
import { GetTokenBalanceAction } from './actions/get-token-balance'
import { ReadContractAction } from './actions/read-contract'

export class BlockchainDefinition extends SingleIntegrationDefinition {
  integrationKey = 'blockchain'
  integrationVersion = '1'
  schemaUrl = null

  actions = [new GetTokenBalanceAction(), new ReadContractAction()]

  async beforeCreateWorkflowAction(
    workflowAction: DeepPartial<WorkflowAction>,
    integrationAction: IntegrationAction,
  ): Promise<DeepPartial<WorkflowAction>> {
    if (workflowAction.inputs?.network && workflowAction.inputs.address) {
      const abi = await ExplorerService.instance.getContractAbi(
        Number(workflowAction.inputs.network),
        workflowAction.inputs.address.toString(),
      )
      if (!abi) {
        return workflowAction
      }
      if (integrationAction.key === 'readContract') {
        const operation = abi.find(
          (def: MethodAbi) => def.name === workflowAction.inputs?.operation?.toString() && def.type === 'function',
        ) as MethodAbi
        workflowAction.schemaResponse = methodsAbiToOutputJsonSchema(operation)
      }
    }
    return workflowAction
  }

  async beforeUpdateWorkflowAction(
    workflowAction: DeepPartial<WorkflowAction>,
    integrationAction: IntegrationAction,
  ): Promise<DeepPartial<WorkflowAction>> {
    return this.beforeCreateWorkflowAction(workflowAction, integrationAction)
  }

  async beforeCreateWorkflowTrigger(
    workflowTrigger: DeepPartial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
  ): Promise<DeepPartial<WorkflowTrigger>> {
    if (workflowTrigger.inputs?.network && workflowTrigger.inputs.address) {
      const abi = await ExplorerService.instance.getContractAbi(
        Number(workflowTrigger.inputs.network),
        workflowTrigger.inputs.address.toString(),
      )
      if (!abi) {
        return workflowTrigger
      }
      if (integrationTrigger.key === 'newEvent') {
        const event = abi.find(
          (def: EventAbi) => def.name === workflowTrigger.inputs?.event?.toString() && def.type === 'event',
        ) as EventAbi
        workflowTrigger.schemaResponse = {
          type: 'object',
          properties: {
            log: eventsAbiToOutputJsonSchema(event),
          },
        }
      }
    }
    return workflowTrigger
  }

  async beforeUpdateWorkflowTrigger(
    workflowTrigger: DeepPartial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
  ): Promise<DeepPartial<WorkflowTrigger>> {
    return this.beforeCreateWorkflowTrigger(workflowTrigger, integrationTrigger)
  }

  parseError(e: any): string {
    let error = e.response?.text ?? e.response ?? e.message ?? ''
    const config = blockchainConfigList()
    for (const network of Object.values(config.networks)) {
      error = error.replaceAll(network.url, '<RPC>')
    }
    return error
  }
}
