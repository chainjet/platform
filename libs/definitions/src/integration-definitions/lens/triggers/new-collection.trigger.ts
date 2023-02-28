import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { refreshLensAccessToken } from '../lens.common'

export class NewCollectionTrigger extends OperationTrigger {
  idKey = 'items[].notificationId'
  key = 'newCollection'
  name = 'New Collection'
  description = 'Triggers when someone collects one of your posts or comments'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
        description:
          'The ID of the post or comment to watch for collections. If empty, it will trigger on any collection.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      notificationId: {
        type: 'string',
      },
      publicationId: {
        type: 'string',
      },
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
          isDefault: {
            type: 'boolean',
          },
          handle: {
            type: 'string',
          },
          ownedBy: {
            type: 'string',
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

  private walletQuery = `
    address
    defaultProfile {
      id
      name
      bio
      isDefault
      handle
      ownedBy
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
  `

  async run({ inputs, credentials, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }

    let items: any[]
    if (inputs.publicationId && !['undefined', 'null'].includes(inputs.publicationId)) {
      items = await this.getCollectionsForSpecificPublication(inputs.publicationId, credentials, !!fetchAll)
    } else {
      items = await this.getCollectionsForAllPublications(credentials, !!fetchAll)
    }

    return {
      outputs: {
        items,
      },
      refreshedCredentials,
    }
  }

  private async getCollectionsForAllPublications(credentials: Record<string, any>, fetchAll: boolean) {
    const query = `
      query Notifications {
        notifications(request: { profileId: "${
          credentials.profileId
        }", notificationTypes: [COLLECTED_POST, COLLECTED_COMMENT], limit: ${fetchAll ? 50 : 10} }) {
          items {
            ... on NewCollectNotification {
              notificationId
              wallet {
                ${this.walletQuery}
              }
              collectedPublication {
                ... on Post {
                  id
                }
                ... on Comment {
                  id
                }
              }
            }
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': credentials.accessToken,
    })
    if (!res?.data?.notifications?.items) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return res.data.notifications.items.map((item) => ({
      ...item.wallet,
      notificationId: item.notificationId,
      publicationId: item.collectedPublication.id,
    }))
  }

  async getCollectionsForSpecificPublication(
    publicationId: string,
    credentials: Record<string, any>,
    fetchAll: boolean,
  ) {
    const query = `
      query {
        whoCollectedPublication (request: { publicationId: "${publicationId}", limit: ${fetchAll ? 50 : 10} }) {
          items {
            ${this.walletQuery}
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': credentials.accessToken,
    })
    if (!res?.data?.whoCollectedPublication?.items) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return res.data.whoCollectedPublication.items.map((item) => ({
      ...item,
      notificationId: `collected-post-${item.address}-${publicationId}`,
      publicationId: publicationId,
    }))
  }
}
