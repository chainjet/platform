import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { ProviderService } from '@blockchain/blockchain/calls/provider.service'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { abiToOutputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { DeepPartial } from '@nestjs-query/core'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { MethodAbi } from 'ethereum-types'
import { ethers } from 'ethers'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class SmartContractDefinition extends SingleIntegrationDefinition {
  integrationKey = 'smart-contract'
  integrationVersion = '1'
  schemaUrl = null

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
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

  async beforeCreateWorkflowAction(workflowAction: DeepPartial<WorkflowAction>): Promise<DeepPartial<WorkflowAction>> {
    if (workflowAction.inputs?.network && workflowAction.inputs.address && workflowAction.inputs.operation) {
      const abi = await ExplorerService.instance.getContractAbi(
        Number(workflowAction.inputs.network),
        workflowAction.inputs.address.toString(),
      )
      if (abi) {
        const operation = abi.find(
          (def: MethodAbi) => def.name === workflowAction.inputs?.operation?.toString() && def.type === 'function',
        ) as MethodAbi
        workflowAction.schemaResponse = abiToOutputJsonSchema(operation)
      }
    }
    return workflowAction
  }

  async beforeUpdateWorkflowAction(workflowAction: DeepPartial<WorkflowAction>): Promise<DeepPartial<WorkflowAction>> {
    return this.beforeCreateWorkflowAction(workflowAction)
  }
}
