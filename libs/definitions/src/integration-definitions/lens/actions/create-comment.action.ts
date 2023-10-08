import { AuthenticationError } from '@app/common/errors/authentication-error'
import { wait } from '@app/common/utils/async.utils'
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

export class CreateCommentAction extends OperationOffChain {
  key = 'createComment'
  name = 'Create Comment'
  description = 'Creates a new comment on a given post'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['publicationId', 'content'],
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
      },
      content: {
        title: 'Comment content',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Content of the comment (max 5000 characters)',
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
      dataAvailabilityId: {
        type: 'string',
      },
      txHash: {
        type: 'string',
      },
      txId: {
        type: 'string',
      },
    },
  }

  protected readonly logger = new Logger(CreateCommentAction.name)

  async run({ inputs, credentials, workflow }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication failed, please connect the profile again')
    }
    if (!inputs.content) {
      throw new Error('Content is required')
    }
    if (!inputs.publicationId) {
      throw new Error('Publication ID is required')
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
      metadata_id: uuid(),
      description: content,
      content,
      external_url: credentials.handle ? `https://hey.xyz/u/${credentials.handle}` : 'https://chainjet.io',
      image: imageIpfs || null,
      imageMimeType,
      name: credentials.handle ? `New Comment by @${credentials.handle}` : 'New Comment',
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

    const isDAPublication = inputs.publicationId.includes('-DA-')

    this.logger.log(
      `Creating lens comment${isDAPublication ? ' on DA publication' : ''}: ${workflow?.id} ${profileId} ${fileUrl}`,
    )

    // Lens DA now requires to wait until more nows seen the IPFS file, so we need to wait
    // TODO we should schedule the wait
    if (isDAPublication) {
      await wait(60 * 10 * 1000)
      this.logger.log(`Waited for 5 minutes for IPFS on DA publication for workflow ${workflow?.id}`)
    }

    let query: string
    if (isDAPublication) {
      query = `
      mutation CreateDataAvailabilityCommentViaDispatcher {
        createDataAvailabilityCommentViaDispatcher(request: {
          from: "${profileId}"
          commentOn: "${inputs.publicationId}"
          contentURI: "${fileUrl}"
        }) {
          ... on CreateDataAvailabilityPublicationResult {
            id
            proofs
            dataAvailabilityId
          }
          ... on RelayError {
            reason
          }
        }
      }`
    } else {
      query = `
      mutation CreatePostViaDispatcher {
        createCommentViaDispatcher(
          request: {
            profileId: "${profileId}"
            publicationId: "${inputs.publicationId}",
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
    }

    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
      origin: process.env.LORIGIN,
    })
    const resData = isDAPublication
      ? res?.data?.createDataAvailabilityCommentViaDispatcher
      : res?.data?.createCommentViaDispatcher

    // only non-DA publications have a txHash
    if ((isDAPublication && !resData?.dataAvailabilityId) || (!isDAPublication && !resData?.txHash)) {
      if (res?.errors?.[0]?.message) {
        throw new AuthenticationError(res.errors[0].message)
      }
      this.logger.error(`Failed to create lens comment: ${workflow?.id} ${JSON.stringify(res?.errors ?? res?.data)}`)
      throw new AuthenticationError(`Failed to post message: ${JSON.stringify(res?.errors ?? res?.data)}`)
    }

    if (isDAPublication) {
      return {
        outputs: {
          dataAvailabilityId: resData.dataAvailabilityId,
        },
        refreshedCredentials,
      }
    } else {
      return {
        outputs: {
          txHash: res.data.createCommentViaDispatcher.txHash,
          txId: res.data.createCommentViaDispatcher.txId,
        },
        refreshedCredentials,
        transactions: [
          {
            chainId: ChainId.POLYGON,
            hash: res.data.createCommentViaDispatcher.txHash,
          },
        ],
        credits: 50,
      }
    }
  }
}
