import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { ChainId } from '@blockchain/blockchain/types/ChainId'
import { Logger } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import Arweave from 'arweave'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { v4 as uuidv4 } from 'uuid'
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

  protected readonly logger = new Logger(CreateCommentAction.name)

  async run({ inputs, credentials, workflow }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
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

    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    })

    const { imageUrl } = inputs
    let imageMimeType = imageUrl ? `image/${imageUrl.split('.').pop()}` : null
    if (!imageMimeType || ![3, 4].includes(imageMimeType.length)) {
      imageMimeType = imageUrl ? 'image/jpeg' : null
    }

    const data = {
      version: '2.0.0',
      metadata_id: uuidv4(),
      description: content,
      content,
      external_url: credentials.handle ? `https://lenster.xyz/u/${credentials.handle}` : 'https://chainjet.io',
      image: imageUrl || null,
      imageMimeType,
      name: credentials.handle ? `New Comment by @${credentials.handle}` : 'New Comment',
      tags: (content.match(/#[a-zA-Z0-9]+/g) ?? []).map((tag: string) => tag.slice(1)),
      mainContentFocus: imageUrl ? 'IMAGE' : 'TEXT_ONLY',
      contentWarning: null,
      attributes: [{ traitType: 'type', displayType: 'string', value: 'post' }],
      media: imageUrl
        ? [
            {
              item: imageUrl,
              type: imageMimeType,
              altTag: '',
            },
          ]
        : [],
      locale: 'en-US',
      createdOn: new Date().toISOString(),
      appId: 'ChainJet',
    }

    const key = JSON.parse(process.env.ARWEAVE_PRIVATE_KEY!)
    const transaction = await arweave.createTransaction(
      {
        data: JSON.stringify(data),
      },
      key,
    )
    transaction.addTag('Content-Type', 'application/json')
    transaction.addTag('App-Name', 'ChainJet')

    await arweave.transactions.sign(transaction, key)
    await arweave.transactions.post(transaction)

    const fileUrl = `https://arweave.net/${transaction.id}`

    this.logger.log(`Creating lens comment: ${workflow?.id} ${profileId} ${fileUrl}`)
    const query = `
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

    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
      origin: process.env.LORIGIN,
    })
    if (!res?.data?.createCommentViaDispatcher?.txHash) {
      if (res?.errors?.[0]?.message) {
        throw new AuthenticationError(res.errors[0].message)
      }
      this.logger.error(`Failed to create lens comment: ${workflow?.id} ${JSON.stringify(res?.errors ?? res?.data)}`)
      throw new AuthenticationError(`Failed to post message: ${JSON.stringify(res?.errors ?? res?.data)}`)
    }
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
    }
  }
}
