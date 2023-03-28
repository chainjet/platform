import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { ChainId } from '@blockchain/blockchain/types/ChainId'
import { Logger } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import axios from 'axios'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { v4 as uuid } from 'uuid'
import { getLensCollectModule, refreshLensAccessToken } from '../lens.common'

export class CreatePostAction extends OperationOffChain {
  key = 'createPost'
  name = 'Create Post'
  description = 'Creates a new post'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['content'],
    properties: {
      content: {
        title: 'Post content',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Content of the post (max 5000 characters)',
      } as JSONSchema7Definition,
      imageUrl: {
        title: 'Image URL',
        description: 'URL of the image to be attached to the post. It will be uploaded to IPFS.',
        type: 'string',
      },
      collect: {
        title: 'Who can collect?',
        type: 'string',
        default: 'anyone',
        oneOf: [
          {
            title: 'Anyone',
            const: 'anyone',
          },
          {
            title: 'Only followers',
            const: 'followers',
          },
          {
            title: 'No one',
            const: 'none',
          },
        ],
      },
    },
    allOf: [
      {
        if: {
          properties: {
            collect: {
              enum: ['anyone', 'followers'],
            },
          },
        },
        then: {
          properties: {
            paidCollect: {
              title: 'Charge for collecting',
              description: 'Set a fee to collect the post',
              type: 'boolean',
              default: false,
            },
          },
        },
      },
      {
        if: {
          properties: {
            paidCollect: {
              const: true,
            },
          },
        },
        then: {
          properties: {
            collectFee: {
              title: 'Collection fee',
              description: 'Fee to collect the post',
              default: 1,
              type: 'number',
            },
            // https://github.com/lens-protocol/token-list/blob/main/mainnet-token-list.json
            collectCurrency: {
              title: 'Select Currency',
              type: 'string',
              default: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
              oneOf: [
                {
                  title: 'USDC (USD Coin)',
                  const: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                },
                {
                  title: 'DAI (Dai Stablecoin)',
                  const: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
                },
                {
                  title: 'WETH (Wrapped Ether)',
                  const: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
                },
                {
                  title: 'WMATIC (Wrapped Matic)',
                  const: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
                },
                {
                  title: 'NCT (Nature Carbon Tonne)',
                  const: '0xD838290e877E0188a4A44700463419ED96c16107',
                },
              ],
            },
            mirrorReferral: {
              title: 'Mirror referral percentage',
              description: 'Share your fee with people who mirrors your content',
              type: 'number',
              default: 0,
              minimum: 0,
              maximum: 100,
            },
            maxCollects: {
              title: 'Max number of collects allowed',
              description: 'Limit the maximum number of collects allowed. Set to 0 to disable.',
              type: 'integer',
              default: 0,
            },
            collectTimeLimit: {
              title: 'Limit collecting to the first 24h',
              description: 'Limit the collection to the first 24h after the post is created',
              type: 'boolean',
              default: false,
            },
          },
        },
      },
    ],
  }
  outputs: JSONSchema7 = {
    properties: {
      txHash: {
        type: 'string',
      },
      txId: {
        type: 'string',
      },
    },
  }

  protected readonly logger = new Logger(CreatePostAction.name)

  limits({ user }: OperationRunOptions): { daily: number } | null {
    if (user?.planConfig.key && !['free', 'early'].includes(user.planConfig.key)) {
      return null
    }
    const userLimit = user?.limits?.['daily-lens-posts']
    if (userLimit === 0) {
      return null
    }
    return {
      daily: userLimit ?? 5,
    }
  }

  async run({ inputs, credentials, workflow, user }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    if (!inputs.content) {
      throw new Error('Content is required')
    }
    const { profileId, refreshToken } = credentials
    const refreshedCredentials = await refreshLensAccessToken(refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }

    const content = inputs.content.slice(0, 5000)

    const metadataId = uuid()

    const { imageUrl } = inputs
    let imageUrls: string[] = []
    if (imageUrl && typeof imageUrl === 'string') {
      imageUrls = [imageUrl]
    } else if (Array.isArray(imageUrl)) {
      imageUrls = imageUrl
    }

    // up to 1 non IPFS image is allowed
    if (imageUrls.length > 1 && imageUrls.some((imageUrl) => !imageUrl.startsWith('ipfs://'))) {
      throw new Error('Maximum of 1 image is allowed')
    }

    const imageMimeTypes = imageUrls.map((imageUrl) => {
      let imageMimeType = imageUrl ? `image/${imageUrl.split('.').pop()}` : null
      if (!imageMimeType || ![3, 4].includes(imageMimeType.length)) {
        imageMimeType = imageUrl ? 'image/jpeg' : null
      }
      return imageMimeType
    })

    // upload image to IPFS
    let ipfsImages: string[] = []
    if (imageUrls.length && !imageUrls[0].startsWith('ipfs://')) {
      const uploadFileUrl = `https://api.apireum.com/v1/ipfs/upload-file-url?key=${process.env.APIREUM_API_KEY}`
      const res = await axios.post(uploadFileUrl, {
        url: imageUrl,
        id: metadataId + '-media-0',
      })
      if (!res?.data?.file?.cid) {
        throw new Error('Failed to upload image to IPFS')
      }
      ipfsImages = [`ipfs://${res.data.file.cid}`]
    } else {
      ipfsImages = imageUrls
    }

    const data = {
      version: '2.0.0',
      metadata_id: metadataId,
      description: content,
      content,
      external_url: credentials.handle ? `https://lenster.xyz/u/${credentials.handle}` : 'https://chainjet.io',
      image: ipfsImages[0] || null,
      imageMimeType: imageMimeTypes[0],
      name: credentials.handle ? `New Post by @${credentials.handle}` : 'New Post',
      tags: (content.match(/#[a-zA-Z0-9]+/g) ?? []).map((tag: string) => tag.slice(1)),
      mainContentFocus: ipfsImages.length ? 'IMAGE' : 'TEXT_ONLY',
      contentWarning: null,
      attributes: [{ traitType: 'type', displayType: 'string', value: 'post' }],
      media: ipfsImages.map((imageUrl, index) => ({
        item: imageUrl,
        type: imageMimeTypes[index],
        altTag: '',
      })),
      locale: 'en-US',
      createdOn: new Date().toISOString(),
      appId: 'ChainJet',
    }

    const uploadTextUrl = `https://api.apireum.com/v1/ipfs/upload-text-file?key=${process.env.APIREUM_API_KEY}`
    const postRes = await axios.post(uploadTextUrl, {
      id: metadataId,
      content: JSON.stringify(data),
    })
    if (!postRes?.data?.file?.cid) {
      throw new Error('Failed to upload post')
    }
    const fileUrl = 'ipfs://' + postRes.data.file.cid

    const { collect, paidCollect, collectFee, collectCurrency, mirrorReferral, maxCollects, collectTimeLimit } = inputs
    const collectModule = getLensCollectModule({
      recipientAddress: user!.address,
      collect,
      paidCollect,
      collectFee,
      collectCurrency,
      mirrorReferral,
      maxCollects,
      collectTimeLimit,
    })

    this.logger.log(`Creating lens post: ${workflow?.id} ${profileId} ${fileUrl}`)
    const query = `
    mutation CreatePostViaDispatcher {
      createPostViaDispatcher(
        request: {
          profileId: "${profileId}"
          contentURI: "${fileUrl}"
          collectModule: {
            ${collectModule}
          }
          referenceModule: { followerOnlyReferenceModule: false }
        }
      ) {
        ... on RelayerResult {
          txHash
          txId
        }
        ... on RelayError {
          reason
        }
      }
    }`

    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
      origin: process.env.LORIGIN,
    })
    if (!res?.data?.createPostViaDispatcher?.txHash) {
      if (res?.errors?.[0]?.message) {
        throw new AuthenticationError(res.errors[0].message)
      }
      this.logger.error(`Failed to create lens post: ${workflow?.id} ${JSON.stringify(res?.errors ?? res?.data)}`)
      throw new AuthenticationError(`Failed to post message: ${JSON.stringify(res?.errors ?? res?.data)}`)
    }
    return {
      outputs: {
        txHash: res.data.createPostViaDispatcher.txHash,
        txId: res.data.createPostViaDispatcher.txId,
      },
      refreshedCredentials,
      transactions: [
        {
          chainId: ChainId.POLYGON,
          hash: res.data.createPostViaDispatcher.txHash,
        },
      ],
    }
  }
}
