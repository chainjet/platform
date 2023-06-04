import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { getAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export class GetDefaultProfileAction extends OperationOffChain {
  key = 'getDefaultProfile'
  name = 'Get Profile'
  description = 'Get the default Lens profile of any address.'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['address'],
    properties: {
      address: {
        title: 'Wallet Address',
        type: 'string',
        description: 'The wallet address of the profile to get.',
      },
      failIfNotFound: {
        title: 'Fail if not found',
        type: 'boolean',
        description: 'If selected, the workflow will fail if the profile is not found.',
        default: true,
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      handle: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      bio: {
        type: 'string',
      },
      attributes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            displayType: {
              type: 'string',
            },
            traitType: {
              type: 'string',
            },
            key: {
              type: 'string',
            },
            value: {
              type: 'string',
            },
          },
        },
      },
      followNftAddress: {
        type: 'string',
      },
      metadata: {
        type: 'string',
      },
      dispatcher: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
          },
          canUseRelay: {
            type: 'boolean',
          },
        },
      },
      stats: {
        type: 'object',
        properties: {
          totalFollowers: {
            type: 'number',
          },
          totalFollowing: {
            type: 'number',
          },
          totalPosts: {
            type: 'number',
          },
          totalComments: {
            type: 'number',
          },
          totalMirrors: {
            type: 'number',
          },
          totalPublications: {
            type: 'number',
          },
          totalCollects: {
            type: 'number',
          },
        },
      },
      followModule: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
          },
          contractAddress: {
            type: 'string',
          },
        },
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const address = getAddress(inputs.address.toLowerCase())
    const query = `
    query {
      defaultProfile(request: { ethereumAddress: "${address}"}) {
        id
        handle
        name
        bio
        attributes {
          displayType
          traitType
          key
          value
        }
        followNftAddress
        metadata
        dispatcher {
          address
          canUseRelay
        }
        stats {
          totalFollowers
          totalFollowing
          totalPosts
          totalComments
          totalMirrors
          totalPublications
          totalCollects
        }
        followModule {
          ... on FeeFollowModuleSettings {
            type
            contractAddress
          }
          ... on ProfileFollowModuleSettings {
           type
          }
          ... on RevertFollowModuleSettings {
           type
          }
        }
      }
    }`
    const res = await sendGraphqlQuery('https://api.lens.dev/', query)
    if (!res?.data?.defaultProfile) {
      if (inputs.failIfNotFound) {
        throw new Error(res.errors?.[0]?.message ?? 'Wallet address does not have a default Lens profile.')
      }
      return { outputs: {} }
    }
    return {
      outputs: {
        ...res.data.defaultProfile,
      },
    }
  }
}
