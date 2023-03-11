import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class NewPoapCollected extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newPoapCollected'
  name = 'New POAP collected'
  description = 'Triggers when any POAP is collected by a given wallet'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Wallet address',
        type: 'string',
        description: 'The wallet address to watch for new POAP tokens',
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
      chainId: {
        type: 'number',
      },
      chainName: {
        type: 'string',
      },
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

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    const { address } = inputs
    if (!isAddress(address)) {
      throw new Error(`"${address}" is not a valid address`)
    }

    const tokens = fetchAll ? await this.fetchAllPoaps(address) : await this.fetchLatestPoaps(address)
    return {
      outputs: {
        items: tokens,
      },
    }
  }

  async fetchLatestPoaps(address: string) {
    const url = `https://api.apireum.com/v1/poap/tokens/${address}?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.tokens
  }

  async fetchAllPoaps(address: string, page = 1) {
    const url = `https://api.apireum.com/v1/poap/tokens/${address}?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt&page=${page}&limit=100`
    const res = await fetch(url)
    const data = await res.json()
    if (data.tokens && data.tokens.length >= 100) {
      return [...data.tokens, ...(await this.fetchAllPoaps(address, page + 1))]
    }
    return data.tokens ? data.tokens : []
  }
}
