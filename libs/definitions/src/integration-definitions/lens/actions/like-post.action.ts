import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { getLensProfileId, refreshLensAccessToken } from '../lens.common'

export class LikePostAction extends OperationOffChain {
  key = 'likePost'
  name = 'Like Post'
  description = 'Lile a given post'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['publicationId'],
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
      },
    },
  }
  outputs: JSONSchema7 = {}

  async run({ inputs, credentials, workflow }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    if (!inputs.publicationId) {
      throw new Error('Publication ID is required')
    }
    const { profileId, refreshToken } = credentials
    const refreshedCredentials = await refreshLensAccessToken(refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }

    const lensProfileId = await getLensProfileId(profileId)

    const query = `
    mutation AddReaction {
      addReaction(request: { profileId: "${lensProfileId}", reaction: UPVOTE, publicationId: "${inputs.publicationId}" })
    }`

    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
      origin: process.env.LORIGIN,
    })
    return {
      outputs: {},
      refreshedCredentials,
      credits: 25,
    }
  }
}
