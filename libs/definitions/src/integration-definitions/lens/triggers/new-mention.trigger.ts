import { AuthenticationError } from '@app/common/errors/authentication-error'
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
  version = '1.1.0'

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
              content: {
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
            },
          },
          canComment: {
            title: 'Can comment on the post',
            description: 'Whether the logged user can comment on the post',
            type: 'boolean',
          },
          mainPost: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
            },
          },
        },
      },
    },
  }

  async run({ inputs, credentials, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    const { profileId } = credentials

    // const postOrCommentQuery = `
    //   id
    //   stats {
    //     totalAmountOfMirrors
    //     totalAmountOfCollects
    //     totalAmountOfComments
    //   }
    //   metadata {
    //     name
    //     content
    //   }
    //   profile {
    //     id
    //     name
    //     bio
    //     isDefault
    //     handle
    //     ownedBy
    //     stats {
    //       totalFollowers
    //       totalFollowing
    //       totalPosts
    //       totalComments
    //       totalMirrors
    //       totalPublications
    //       totalCollects
    //     }
    //   }
    //   canComment(profileId: "${profileId}") {
    //     result
    //   }
    // `
    const postOrCommentQuery = `
    id
    stats {
      mirrors
      comments
    }
    metadata {
      ... on TextOnlyMetadataV3 {
        id
        content
      }
      ... on ArticleMetadataV3 {
        id
        content
      }
      ... on ImageMetadataV3 {
        id
        content
      }
      ... on LinkMetadataV3 {
        id
        content
      }
    }
    by {
      id
      handle {
        fullHandle
      }
      ownedBy {
        address
      }
      metadata {
        displayName
      }
    }`

    const query = `
      query Notifications {
        notifications(request: { where: { notificationTypes: [MENTIONED, MENTIONED] } }) {
          items {
            ... on MentionNotification {
              id
              publication {
                ... on Post {
                  ${postOrCommentQuery}
                }
                ... on Comment {
                  ${postOrCommentQuery}
                }
              }
            }
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api-v2.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
    })
    if (!res?.data?.notifications?.items) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }

    return {
      outputs: {
        items: res.data.notifications.items.map((item) => {
          item.profile = item.publication.by
          item.profile.name = item.publication.by.metadata?.displayName
          item.profile.handle = item.publication.by.handle?.fullHandle
          item.profile.ownedBy = item.publication.by.ownedBy?.address
          delete item.publication.by
          delete item.profile.metadata

          item.mentionPublication = item.publication
          if (item.stats) {
            item.stats.totalAmountOfMirrors = item.stats.mirrors
            item.stats.totalAmountOfComments = item.stats.comments
            // item.stats.totalAmountOfCollects = item.stats.collects // TODO
          }
          delete item.publication
          return item
        }),
      },
      refreshedCredentials,
    }
  }
}
