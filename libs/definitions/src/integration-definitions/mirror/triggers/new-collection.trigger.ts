import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewCollectionTrigger extends OperationTrigger {
  idKey = 'items[].address'
  key = 'newCollection'
  name = 'New Collection'
  description = 'Triggers when someone collects a specific post'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['postId'],
    properties: {
      postId: {
        title: 'Post ID',
        type: 'string',
        description: 'The ID of the Mirror post. It can be found on the post URL.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      address: {
        type: 'string',
      },
      blockNumber: {
        type: 'integer',
      },
      message: {
        type: 'string',
      },
      price: {
        type: 'string',
      },
      tokenId: {
        type: 'string',
      },
      transactionHash: {
        type: 'string',
      },
      project: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
          },
          avatarURL: {
            type: 'string',
          },
          displayName: {
            type: 'string',
          },
          domain: {
            type: 'string',
          },
          ens: {
            type: 'string',
          },
        },
      },
    },
  }

  async run({ inputs, fetchAll, cursor }: OperationRunOptions): Promise<RunResponse | null> {
    const { postId } = inputs

    const url = `https://api.apireum.com/v1/mirror/post/${postId}/collections?key=${process.env.APIREUM_API_KEY}&sort=-tokenId`
    const res = await fetch(url)
    const data = await res.json()
    return {
      outputs: {
        items: data.collections,
      },
    }
  }
}
