import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewPostTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newPost'
  name = 'New Post'
  description = 'Triggers when a wallet creates a new post'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Wallet Address or ENS',
        type: 'string',
        description: '',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'integer',
      },
      digest: {
        type: 'string',
      },
      url: {
        type: 'string',
      },
      title: {
        type: 'string',
      },
      body: {
        type: 'string',
      },
      publishedAtTimestamp: {
        type: 'integer',
      },
      writingNFT: {
        type: 'object',
        properties: {
          optimisticNumSold: {
            type: 'integer',
          },
          proxyAddress: {
            type: 'string',
          },
          purchases: {
            type: 'object',
            properties: {
              numSold: {
                type: 'integer',
              },
            },
          },
        },
      },
      featuredImage: {
        type: 'string',
      },
    },
  }

  async run({ inputs, fetchAll, cursor }: OperationRunOptions): Promise<RunResponse | null> {
    const { address } = inputs

    const url = `https://api.apireum.com/v1/mirror/posts/${address}?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return {
      outputs: {
        items: data.posts?.map((post: any) => ({
          ...post,
          url: `https://mirror.xyz/${address}/${post.digest}`,
        })),
      },
    }
  }
}
