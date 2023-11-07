import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class GetPublicationAction extends OperationOffChain {
  key = 'getPublication'
  name = 'Get Publication'
  description = 'Get a Lens publication by ID.'
  version = '1.0.0'
  skipAuth = true

  inputs: JSONSchema7 = {
    required: ['publicationId'],
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
        description: 'The Lens publication ID (e.g. 0x012cd6-0x01).',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      publicationType: {
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
                value: {
                  type: 'string',
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
      referenceModule: {
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
      appId: {
        type: 'string',
      },
      hidden: {
        type: 'boolean',
      },
      hasCollectedByMe: {
        type: 'boolean',
      },
      mirrorOf: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
        },
      },
      mainPost: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          mirrorOf: {
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

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const { publicationId } = inputs
    const query = `
    {
      publication(request: { publicationId: "${publicationId}" }) {
        __typename 
        ... on Post {
          id
          profile {
            ...ProfileFields
          }
          stats {
            ...PublicationStatsFields
          }
          metadata {
            ...MetadataOutputFields
          }
          createdAt
          collectModule {
            ...CollectModuleFields
          }
          referenceModule {
            ...ReferenceModuleFields
          }
          appId
          hidden
          hasCollectedByMe
        }
        ... on Comment {
          id
          profile {
            ...ProfileFields
          }
          stats {
            ...PublicationStatsFields
          }
          metadata {
            ...MetadataOutputFields
          }
          createdAt
          collectModule {
            ...CollectModuleFields
          }
          referenceModule {
            ...ReferenceModuleFields
          }
          appId
          hidden
          reaction(request: null)
          mirrors(by: null)
          hasCollectedByMe
          mainPost {
            ... on Post {
              id
            }
            ... on Mirror {
              id
              mirrorOf {
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
        ... on Mirror {
          id
          mirrorOf {
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
    
    fragment ProfileFields on Profile {
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
    
    fragment PublicationStatsFields on PublicationStats { 
      totalAmountOfMirrors
      totalAmountOfCollects
      totalAmountOfComments
    }
    
    fragment MetadataOutputFields on MetadataOutput {
      name
      description
      content
      media {
        original {
          url
          mimeType
        }
      }
      attributes {
        displayType
        traitType
        value
      }
    }

    fragment CollectModuleFields on CollectModule {
      ... on FreeCollectModuleSettings {
        type
        followerOnly
        contractAddress
      }
      ... on FeeCollectModuleSettings {
        type
        contractAddress
        followerOnly
      }
      ... on LimitedFeeCollectModuleSettings {
        type
        contractAddress
        followerOnly
      }
      ... on LimitedTimedFeeCollectModuleSettings {
        type
        contractAddress
        followerOnly
      }
      ... on RevertCollectModuleSettings {
        type
      }
      ... on TimedFeeCollectModuleSettings {
        type
        contractAddress
        followerOnly
      }
      ... on UnknownCollectModuleSettings {
        type
        contractAddress
      }
    }
    
    fragment ReferenceModuleFields on ReferenceModule {
      ... on FollowOnlyReferenceModuleSettings {
        type
        contractAddress
      }
      ... on UnknownReferenceModuleSettings {
        type
        contractAddress
      }
      ... on DegreesOfSeparationReferenceModuleSettings {
        type
        contractAddress
      }
    }`
    const res = await sendGraphqlQuery('https://api-v2.lens.dev/', query)
    if (!res?.data?.publication) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    return {
      outputs: {
        ...res.data.publication,
        publicationType: res.data.publication.__typename,
      },
    }
  }
}
