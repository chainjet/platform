import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { getLensProfileId } from '../lens.common'

export class NewFollowerTrigger extends OperationTrigger {
  idKey = 'items[].wallet.address'
  key = 'newFollower'
  name = 'New Follower'
  description = 'Triggers when an account has a new follower'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID or Handle',
        type: 'string',
        description: 'A Lens profile ID (e.g. 0x012cd6) or a Lens handle (e.g. chainjet.lens).',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      address: {
        type: 'string',
      },
      defaultProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          bio: {
            type: 'string',
          },
          followNftAddress: {
            type: 'string',
          },
          metadata: {
            type: 'string',
          },
          handle: {
            type: 'string',
          },
          ownedBy: {
            type: 'string',
          },
          dispatcher: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
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
        },
      },
    },
  }

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    const { profileId } = inputs

    const lensProfileId = await getLensProfileId(profileId)

    const query = `
      query Followers {
        followers(request: { profileId: "${lensProfileId}", limit: ${fetchAll ? 50 : 10} }) {
          items {
            wallet {
              address
              defaultProfile {
                id
                name
                bio
                followNftAddress
                metadata
                handle
                ownedBy
                dispatcher {
                  address
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
              }
            }
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query)
    if (!res?.data?.followers?.items) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: res.data.followers,
    }
  }
}
