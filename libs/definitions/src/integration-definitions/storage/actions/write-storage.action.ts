import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { StorageClient } from '../storage.client'

export class WriteStorageAction extends OperationOffChain {
  key = 'writeStorage'
  name = 'Write Storage'
  description = 'Create or update an item'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['database', 'key', 'value'],
    properties: {
      database: {
        title: 'Database key',
        type: 'string',
        description: 'The key of the database to retrieve the item from',
        default: 'default',
      },
      key: {
        title: 'Item key',
        type: 'string',
        description: 'The key of the item to retrieve',
      },
      value: {
        title: 'Item value',
        type: 'string',
        description: 'The value of the item to set',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!user) {
      throw new Error('User not found')
    }
    const client = new StorageClient({ user })
    const item = await client.set(inputs.database, inputs.key, inputs.value)
    return {
      outputs: item ?? {},
    }
  }
}
