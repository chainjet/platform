import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class GetPoapTokenAction extends OperationOffChain {
  key = 'getPoapToken'
  name = 'Get POAP token'
  description = 'Get a POAP token by ID'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['tokenId'],
    properties: {
      tokenId: {
        title: 'Token ID',
        type: 'string',
        description: 'The POAP token ID',
        examples: ['6200322'],
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'number',
      },
      owner: {
        type: 'string',
      },
      mintOrder: {
        type: 'number',
      },
      mintedAt: {
        type: 'string',
      },
      transferCount: {
        type: 'number',
      },
      // chainId: {
      //   type: 'number',
      // },
      // chainName: {
      //   type: 'string',
      // },
      event: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          fancyId: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          eventUrl: {
            type: 'string',
          },
          imageUrl: {
            type: 'string',
          },
          country: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          year: {
            type: 'number',
          },
          startDate: {
            type: 'string',
          },
          endDate: {
            type: 'string',
          },
          expiryDate: {
            type: 'string',
          },
          supply: {
            type: 'number',
          },
        },
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const url = `https://api.apireum.com/v1/poap/token/${inputs.tokenId}?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return {
      outputs: data.token,
    }
  }
}
