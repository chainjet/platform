import { getDateFromObjectId } from '@app/common/utils/mongodb'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { ObjectId } from 'mongodb'
import { StorageClient } from '../storage.client'

export class ReadStorageAction extends OperationOffChain {
  key = 'readStorage'
  name = 'Read Item'
  description = 'Get an item previously stored'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['database', 'key'],
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
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      value: {
        type: 'string',
      },
      createdAt: {
        type: 'string',
      },
    },
  }

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!user) {
      throw new Error('User not found')
    }
    const client = new StorageClient({ user })
    const item = await client.get(inputs.database, inputs.key)
    return {
      outputs: item
        ? {
            id: item.id,
            value: item.value,
            createdAt: getDateFromObjectId(new ObjectId(item.id)).toISOString(),
          }
        : {},
    }
  }
}
