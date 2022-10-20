import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { fetchGraphqlQuery as sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

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
        title: 'Profile ID',
        type: 'string',
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

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    const { profileId } = inputs
    const query = `
      query Followers {
        followers(request: { profileId: "${profileId}", limit: 10 }) {
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
    if (!res?.data?.followers?.items.length) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: res.data.followers,
    }
  }
}
