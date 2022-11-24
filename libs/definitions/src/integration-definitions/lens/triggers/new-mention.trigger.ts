import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { refreshLensAccessToken } from '../lens.common'

export class NewMentionTrigger extends OperationTrigger {
  idKey = 'items[].notificationId'
  key = 'newMention'
  name = 'New Mention'
  description = 'Triggers when someone mentions you in a post or comment'
  version = '1.0.0'

  inputs: JSONSchema7 = {}
  outputs: JSONSchema7 = {
    properties: {
      notificationId: {
        type: 'string',
      },
      mentionPublication: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          stats: {
            type: 'object',
            properties: {
              totalAmountOfMirrors: {
                type: 'number',
              },
              totalAmountOfCollects: {
                type: 'number',
              },
              totalAmountOfComments: {
                type: 'number',
              },
            },
          },
          metadata: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
            },
          },
          profile: {
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
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse | null> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new Error('Authentication is expired, please connect the profile again')
    }
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new Error('Authentication is expired, please connect the profile again')
    }
    const { profileId } = credentials
    const query = `
      query Notifications {
        notifications(request: { profileId: "${profileId}", limit: 10, notificationTypes: [MENTION_POST, MENTION_COMMENT] }) {
          items {
            ... on NewMentionNotification {
              notificationId
              mentionPublication {
                ... on Post {
                  id
                  stats {
                    totalAmountOfMirrors
                    totalAmountOfCollects
                    totalAmountOfComments
                  }
                  metadata {
                    name
                    description
                  }
                  profile {
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
                }
              }
            }
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
    })
    if (!res?.data?.notifications?.items.length) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: res.data.notifications,
    }
  }
}
