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
import { refreshLensAccessToken } from '../lens.common'

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
    },
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
    const userLimit = user?.limits?.['daily-lens-posts']
    if (userLimit === 0) {
      return null
    }
    return {
      daily: userLimit ?? 5,
    }
  }

  async run({ inputs, credentials, workflow }: OperationRunOptions): Promise<RunResponse> {
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
    let imageMimeType = imageUrl ? `image/${imageUrl.split('.').pop()}` : null
    if (!imageMimeType || ![3, 4].includes(imageMimeType.length)) {
      imageMimeType = imageUrl ? 'image/jpeg' : null
    }

    // upload image to IPFS
    let imageIpfs: string | undefined
    if (imageUrl) {
      const uploadFileUrl = `https://api.apireum.com/v1/ipfs/upload-file-url?key=${process.env.APIREUM_API_KEY}`
      const res = await axios.post(uploadFileUrl, {
        url: imageUrl,
        id: metadataId + '-media-0',
      })
      if (!res?.data?.file?.cid) {
        throw new Error('Failed to upload image to IPFS')
      }
      imageIpfs = `ipfs://${res.data.file.cid}`
    }

    const data = {
      version: '2.0.0',
      metadata_id: metadataId,
      description: content,
      content,
      external_url: credentials.handle ? `https://lenster.xyz/u/${credentials.handle}` : 'https://chainjet.io',
      image: imageIpfs || null,
      imageMimeType,
      name: credentials.handle ? `New Post by @${credentials.handle}` : 'New Post',
      tags: (content.match(/#[a-zA-Z0-9]+/g) ?? []).map((tag: string) => tag.slice(1)),
      mainContentFocus: imageIpfs ? 'IMAGE' : 'TEXT_ONLY',
      contentWarning: null,
      attributes: [{ traitType: 'type', displayType: 'string', value: 'post' }],
      media: imageIpfs
        ? [
            {
              item: imageIpfs,
              type: imageMimeType,
              altTag: '',
            },
          ]
        : [],
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

    this.logger.log(`Creating lens post: ${workflow?.id} ${profileId} ${fileUrl}`)
    const query = `
    mutation CreatePostViaDispatcher {
      createPostViaDispatcher(
        request: {
          profileId: "${profileId}"
          contentURI: "${fileUrl}"
          collectModule: { freeCollectModule: { followerOnly: false } }
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
