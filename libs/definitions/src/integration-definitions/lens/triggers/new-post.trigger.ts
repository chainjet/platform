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
  version = '1.1.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID',
        type: 'string',
        description:
          'A Lens profile ID (e.g. 0x012cd6). See [docs](https://docs.chainjet.io/integrations/lens#how-to-get-the-profile-id.) to learn how to find it.',
      },
      mirrors: {
        title: 'Mirrors',
        type: 'string',
        default: 'include',
        oneOf: [
          {
            const: 'include',
            title: 'Include',
          },
          {
            const: 'exclude',
            title: 'Exclude',
          },
          {
            const: 'only',
            title: 'Only include mirrors',
          },
        ],
        description: 'Whether to **include**, **exclude**, or **only include** mirrored posts.',
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
    const { profileId, mirrors = 'include' } = inputs

    const postQuery = `
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
    `

    const mirrorQuery = `
      ... on Mirror {
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
    `

    let publicationTypes: string
    let publicationQuery: string
    switch (mirrors) {
      case 'exclude':
        publicationTypes = '[POST]'
        publicationQuery = postQuery
        break
      case 'only':
        publicationTypes = '[MIRROR]'
        publicationQuery = mirrorQuery
        break
      case 'include':
      default:
        publicationTypes = '[POST, MIRROR]'
        publicationQuery = `
          ${postQuery}
          ${mirrorQuery}
        `
    }

    const query = `
      query Publications {
        publications(request: {
          profileId: "${profileId}",
          publicationTypes: ${publicationTypes},
          limit: 10
        }) {
          items {
            ${publicationQuery}
          }
        }
      }
    `
    const res = await sendGraphqlQuery('https://api.lens.dev/', query)
    if (!res?.data?.publications?.items) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: res.data.publications,
    }
  }
}
