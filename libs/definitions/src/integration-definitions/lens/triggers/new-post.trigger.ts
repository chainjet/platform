import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewPostTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newPost'
  name = 'New Post'
  description = 'Triggers when an account makes a new post'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID',
        type: 'string',
        description: 'A Lens profile ID (e.g. 0x012cd6)',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
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
          content: {
            type: 'string',
          },
          media: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                original: {
                  type: 'object',
                  properties: {
                    url: {
                      type: 'string',
                    },
                    mimeType: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
      createdAt: {
        type: 'string',
      },
      collectModule: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
          },
          followerOnly: {
            type: 'boolean',
          },
          contractAddress: {
            type: 'string',
          },
        },
      },
      appId: {
        type: 'string',
      },
      hidden: {
        type: 'boolean',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    const { profileId } = inputs

    const query = `
      query Publications {
        publications(request: {
          profileId: "${profileId}",
          publicationTypes: [POST],
          limit: 10
        }) {
          items {
            ... on Post {
              id
              profile {
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
              }
              metadata {
                name
                description
                content
                media {
                  original {
                    url
                    mimeType
                  }
                }
              }
              createdAt
              collectModule {
                ... on FreeCollectModuleSettings {
                  type
                  followerOnly
                  contractAddress
                }
              }
              appId
              hidden
            }
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query)
    if (!res?.data?.publications?.items.length) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: res.data.publications,
    }
  }
}
