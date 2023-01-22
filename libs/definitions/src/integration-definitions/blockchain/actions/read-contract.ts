import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { hasInterpolation } from '@app/definitions/utils/field.utils'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { methodsAbiToInputJsonSchema, methodsAbiToOutputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import { ContractAbi, MethodAbi } from 'ethereum-types'
import { ethers } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { BLOCKCHAIN_INPUTS } from '../blockchain.common'

export class ReadContractAction extends OperationAction {
  key = 'readContract'
  name = 'Read Contract'
  description = 'Make a call to read from a smart contract'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['network', 'address'],
    properties: {
      network: BLOCKCHAIN_INPUTS.network,
      address: BLOCKCHAIN_INPUTS.address,
    },
  }
  asyncSchemas: AsyncSchema[] = [{ name: 'operation', dependencies: ['network', 'address', 'abi'] }]

  abiSchema: JSONSchema7 = {
    required: ['abi'],
    properties: {
      abi: {
        type: 'string',
        title: 'Contract ABI',
        description: "We couldn't fetch the ABI for this contract. Please paste it here.",
        'x-ui:widget': 'textarea',
      } as JSONSchema7Definition,
    },
  }

  async beforeCreate(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
  ): Promise<Partial<WorkflowAction>> {
    if (workflowAction.inputs?.network && workflowAction.inputs.address) {
      const abi = workflowAction.inputs.abi
        ? JSON.parse(workflowAction.inputs.abi)
        : await ExplorerService.instance.getContractAbi(
            Number(workflowAction.inputs.network),
            workflowAction.inputs.address.toString(),
          )
      if (!abi) {
        return workflowAction
      }
      const operation = abi.find(
        (def: MethodAbi) => def.name === workflowAction.inputs?.operation?.toString() && def.type === 'function',
      ) as MethodAbi
      workflowAction.schemaResponse = methodsAbiToOutputJsonSchema(operation)
    }
    return workflowAction
  }

  async beforeUpdate(
    update: DeepPartial<WorkflowAction>,
    prevWorkflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
  ): Promise<DeepPartial<WorkflowAction>> {
    if (update.inputs?.network || update.inputs?.address) {
      return this.beforeCreate(update, integrationAction)
    }
    return update
  }

  async getAsyncSchemaExtension(operation: IntegrationAction, { inputs }: GetAsyncSchemasProps): Promise<JSONSchema7> {
    if (!inputs.address || hasInterpolation(inputs.address) || hasInterpolation(inputs.network)) {
      return {}
    }
    if (!isAddress(inputs.address)) {
      throw new Error(`"${inputs.address}" is not a valid address`)
    }

    let abi: ContractAbi | null = null
    if (inputs.abi) {
      try {
        abi = JSON.parse(inputs.abi)
      } catch {
        return this.abiSchema
      }
    } else {
      try {
        abi = await ExplorerService.instance.getContractAbi(inputs.network, inputs.address)
      } catch {}
    }
    if (!abi) {
      return this.abiSchema
    }

    const viewMethods = abi.filter(
      (def: MethodAbi) => def.type === 'function' && ['view', 'pure'].includes(def.stateMutability),
    ) as MethodAbi[]
    const schema = methodsAbiToInputJsonSchema(viewMethods)
    if (typeof schema.properties?.operation === 'object') {
      schema.properties.operation.title = 'Select Operation'
    }
    return inputs.abi ? deepmerge(this.abiSchema, schema) : schema
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const provider = ProviderService.instance.getReadOnlyProvider(Number(inputs.network))
    const abi = inputs.abi
      ? JSON.parse(inputs.abi)
      : await ExplorerService.instance.getContractAbi(Number(inputs.network), inputs.address.toString())
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
}
