import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { BadRequestException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class NewMintTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newMint'
  name = 'New Mint'
  description = 'Triggers when someone mints a specific collection on Zora'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Collection Address',
        type: 'string',
        description: 'The address of the collection to check for new mints',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      collector: {
        type: 'string',
      },
      quantity: {
        type: 'number',
      },
      price: {
        type: 'object',
        properties: {
          nativePrice: {
            type: 'number',
          },
          usdcPrice: {
            type: 'number',
          },
        },
      },
      transactionInfo: {
        type: 'object',
        properties: {
          transactionHash: {
            type: 'string',
          },
          blockTimestamp: {
            type: 'number',
          },
        },
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
    const query = `
    {
      mints(
        networks: [
          {network: ETHEREUM, chain: MAINNET},
          {network: OPTIMISM, chain: OPTIMISM_MAINNET},
          {network: ZORA, chain: ZORA_MAINNET},
          {network: BASE, chain: BASE_MAINNET},
          {network: PGN, chain: PGN_MAINNET},
        ]
        where: {collectionAddresses: ["${inputs.address}"]}
        sort: { sortKey: TIME, sortDirection:DESC }
      ) {
        nodes {
          mint {
            tokenId
            toAddress
            quantity
            price {
              nativePrice {
                decimal
              }
              usdcPrice {
                decimal
              }
            }
            transactionInfo {
              transactionHash
              blockTimestamp
            }
          }
        }
      }
    }`
    const res = await sendGraphqlQuery('https://api.zora.co/graphql', query)
    return {
      outputs: {
        items: res.data.mints.nodes.map((node: any) => ({
          ...node.mint,
          id: node.mint.tokenId,
          collector: node.mint.toAddress,
          price: {
            nativePrice: node.mint.price.nativePrice?.decimal,
            usdcPrice: node.mint.price.usdcPrice?.decimal,
          },
        })),
      },
    }
  }
}
