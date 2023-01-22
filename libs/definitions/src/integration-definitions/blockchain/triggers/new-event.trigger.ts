import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { hasInterpolation } from '@app/definitions/utils/field.utils'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { eventsAbiToInputJsonSchema, eventsAbiToOutputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import deepmerge from 'deepmerge'
import { ContractAbi, EventAbi } from 'ethereum-types'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { BLOCKCHAIN_INPUTS } from '../blockchain.common'

export class NewEventTrigger extends OperationTrigger {
  idKey = ''
  key = 'newEvent'
  name = 'New event'
  description = 'Listens for each new event in a smart contract'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: ['network', 'address'],
    properties: {
      network: BLOCKCHAIN_INPUTS.network,
      address: BLOCKCHAIN_INPUTS.address,
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      blockNumber: { type: 'integer' },
      blockHash: { type: 'string' },
      transactionIndex: { type: 'integer' },
      removed: { type: 'boolean' },
      address: { type: 'string' },
      eventName: { type: 'string' },
      data: { type: 'string' },
      topics: {
        type: 'array',
        items: { type: 'string' },
      },
      transactionHash: { type: 'string' },
      transactionUrl: { type: 'string' },
      logIndex: { type: 'integer' },
    },
  }
  asyncSchemas: AsyncSchema[] = [{ name: 'event', dependencies: ['network', 'address', 'abi'] }]

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
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    if (!workflowTrigger.inputs?.network) {
      throw new Error('Network is required')
    }
    if (!workflowTrigger.inputs?.address) {
      throw new Error('Address is required')
    }
    const abi = workflowTrigger.inputs.abi
      ? JSON.parse(workflowTrigger.inputs.abi)
      : await ExplorerService.instance.getContractAbi(
          Number(workflowTrigger.inputs.network),
          workflowTrigger.inputs.address.toString(),
        )
    if (!abi) {
      return workflowTrigger
    }
    const event = abi.find(
      (def: EventAbi) => def.name === workflowTrigger.inputs?.event?.toString() && def.type === 'event',
    ) as EventAbi
    workflowTrigger.schemaResponse = {
      type: 'object',
      properties: {
        log: eventsAbiToOutputJsonSchema(event),
      },
    }
    return workflowTrigger
  }

  async beforeUpdate(
    update: Partial<WorkflowTrigger>,
    prevWorkflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    if (update.inputs?.network || update.inputs?.address) {
      return this.beforeCreate(update, integrationTrigger, accountCredential)
    }
    return update
  }

  async getAsyncSchemaExtension(operation: IntegrationTrigger, { inputs }: GetAsyncSchemasProps): Promise<JSONSchema7> {
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

    const events = abi.filter((def) => def.type === 'event') as EventAbi[]
    const schema = eventsAbiToInputJsonSchema(events)
    if (typeof schema.properties?.event === 'object') {
      schema.properties.event.title = 'Select Event'
    }
    return inputs.abi ? deepmerge(this.abiSchema, schema) : schema
  }

  async run(opts: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error(`Trying to execute instant trigger`)
  }
}
