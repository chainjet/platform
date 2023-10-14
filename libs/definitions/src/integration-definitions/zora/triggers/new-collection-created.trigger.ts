import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { BadRequestException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class NewCollectionCreatedTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newCollectionCreated'
  name = 'New Collection Created'
  description = 'Triggers when you create a new collection on Zora'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Wallet Address',
        type: 'string',
        'x-default': 'SIGNER_ADDRESS',
        description: 'The wallet address to check for new collections',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      link: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      symbol: {
        type: 'string',
      },
      chainId: {
        type: 'number',
      },
      contractStandard: {
        type: 'string',
      },
      address: {
        type: 'string',
      },
      owner: {
        type: 'string',
      },
      creator: {
        type: 'string',
      },
      txn: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          block: {
            type: 'string',
          },
          timestamp: {
            type: 'string',
          },
        },
      },
      totalMinted: {
        type: 'string',
      },
      isDrop: {
        type: 'boolean',
      },
      renderContract: {
        type: 'string',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    if (!inputs.address) {
      throw new BadRequestException('Wallet address is required')
    }
    if (!isAddress(inputs.address)) {
      throw new BadRequestException('Invalid wallet address. Please enter a valid Ethereum address.')
    }
    const url = `https://zora.co/api/user/${inputs.address}/admin?chainId=1%2C7777777%2C10%2C8453%2C424&direction=desc&limit=1000`
    const res = await fetch(url)
    const collections = await res.json()
    return {
      outputs: {
        items: collections.map((item) => ({
          ...item,
          link: `https://zora.co/collect/zora:${item.id}`,
        })),
      },
    }
  }
}
