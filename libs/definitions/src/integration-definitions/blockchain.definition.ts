import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { MulticallService } from '@blockchain/blockchain/multicall/multicall.service'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { eventsAbiToOutputJsonSchema, methodsAbiToOutputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { DeepPartial } from '@nestjs-query/core'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { EventAbi, MethodAbi } from 'ethereum-types'
import { BigNumber, ethers } from 'ethers'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class BlockchainDefinition extends SingleIntegrationDefinition {
  integrationKey = 'blockchain'
  integrationVersion = '1'
  schemaUrl = null

  async run(options: OperationRunOptions): Promise<RunResponse> {
    switch (options.operation.key) {
      case 'readContract':
        return this.runReadContract(options)
      case 'getTokenBalance':
        return this.runGetTokenBalance(options)
      default:
        throw new Error(`Smart contract method ${options.operation.key} not implemented yet`)
    }
  }

  private async runReadContract({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const provider = ProviderService.instance.getReadOnlyProvider(Number(inputs.network))
    const abi = await ExplorerService.instance.getContractAbi(Number(inputs.network), inputs.address.toString())
    if (!abi) {
      throw new Error(`ABI not found for ${inputs.address} on chain ${inputs.network}`)
    }
    const contract = new ethers.Contract(inputs.address, abi, provider)
    const abiMethod = abi.find((method: MethodAbi) => method.name === inputs.operation) as MethodAbi
    const res = await contract[inputs.operation](...abiMethod.inputs.map((input) => inputs[input.name]))
    const outputValues = abiMethod.outputs.length === 1 ? [res] : res

    const outputs = abiMethod.outputs.reduce((acc, output, index) => {
      let name = output.name
      if (!name) {
        name = abiMethod.outputs.length === 1 ? abiMethod.name : `output${index}`
      }
      acc[name] = outputValues[index]
      return acc
    }, {})

    return {
      outputs,
    }
  }

  private async runGetTokenBalance({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const outputs = await MulticallService.instance.callAndResolve(Number(inputs.network), [
      {
        calls: [
          {
            abi: [
              {
                constant: true,
                inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            address: inputs.tokenAddress,
            name: 'balanceOf',
            params: [inputs.balanceOfAddress],
          },
          {
            abi: [
              {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            address: inputs.tokenAddress,
            name: 'decimals',
            params: [],
          },
        ],
        resolve: (res: [[BigNumber], [number]]) => {
          return {
            balance: res[0][0].toString(),
            tokenDecimals: res[1][0],
            convertedBalance: ethers.utils.formatUnits(res[0][0], res[1][0]),
          }
        },
      },
    ])
    // console.log(`RES =>`, res)
    return {
      outputs: outputs[0],
    }
  }

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
}
