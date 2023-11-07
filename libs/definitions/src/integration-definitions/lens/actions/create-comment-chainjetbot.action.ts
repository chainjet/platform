import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import axios from 'axios'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { refreshLensAccessToken } from '../lens.common'

export class CreateCommentChainJetBotAction extends OperationOffChain {
  key = 'createCommentChainJetBot'
  name = 'Create Comment with @ChainJetBot.lens'
  description = 'Creates a new comment on your own post using @ChainJetBot.lens'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['publicationId', 'content'],
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
        description:
          'Publication ID of the post on which the comment will be added. You can only use @ChainJetBot.lens to comment on your own posts.',
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

    const { publicationId } = inputs
    const query = `
    {
      publication(request: { publicationId: "${publicationId}" }) {
        ... on Post {
          profile {
            id
          }
        }
        ... on Comment {
          profile {
            id
          }
        }
        ... on Mirror {
          profile {
            id
          }
        }
      }
    }`
    const res = await sendGraphqlQuery('https://api-v2.lens.dev/', query)
    if (!res?.data?.publication) {
      throw new Error(res.errors?.[0]?.message ?? 'Bad response from lens')
    }
    if (res.data.publication.profile.id !== profileId) {
      throw new Error('You can only comment with @ChainJetBot.lens on your own posts.')
    }

    await axios(process.env.CHAINJETBOT_CREATE_COMMENT_HOOK!, {
      method: 'POST',
      data: {
        profileId,
        publicationId: inputs.publicationId,
        content: inputs.content,
        imageUrl: inputs.imageUrl,
      },
    })

    return {
      outputs: {
        // txHash: res.data.createCommentViaDispatcher.txHash,
        // txId: res.data.createCommentViaDispatcher.txId,
      },
      refreshedCredentials,
      credits: 50,
    }
  }
}
