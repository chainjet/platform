import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationDailyLimitError } from 'apps/runner/src/errors/operation-daily-limit.error'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { getLensProfileId, refreshLensAccessToken } from '../lens.common'

export class FollowProfileAction extends OperationOffChain {
  key = 'followProfile'
  name = 'Follow Profile'
  description = 'Follow a lens profile'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID or Handle',
        type: 'string',
        description: 'A Lens profile ID (e.g. 0x012cd6) or a Lens handle (e.g. chainjet.lens).',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      proxyAction: {
        type: 'string',
      },
      queuedAt: {
        type: 'string',
      },
    },
  }

  async run({ inputs, credentials, workflow }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken || !credentials?.profileId) {
      throw new AuthenticationError('Authentication failed, please connect the profile again')
    }
    const { profileId } = inputs

    const lensProfileId = await getLensProfileId(profileId)

    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    const query = `
    mutation ProxyAction {
      proxyAction(request: {
        follow: {
          freeFollow: {
            profileId: "${lensProfileId}"
          }
        }
      })
    }`
    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
    })
    if (!res?.data?.proxyAction) {
      if (res?.errors?.[0]?.message) {
        const error = res.errors[0].message
        if (error.includes('Usage limit exceeded')) {
          throw new OperationDailyLimitError(error)
        }
        throw new Error(error)
      }
      throw new Error('Failed to follow profile')
    }
    const proxyAction = res.data.proxyAction
    const statusQuery = `
    query ProxyActionStatus {
      proxyActionStatus(proxyActionId: "${proxyAction}") {
        ... on ProxyActionQueued {
          queuedAt
        }
        ... on ProxyActionError {
          reason
          lastKnownTxId
        }
      }
    }`
    const resStatus = await sendGraphqlQuery('https://api.lens.dev/', statusQuery, {
      'x-access-token': refreshedCredentials.accessToken,
    })
    return {
      outputs: {
        proxyAction,
        queuedAt: resStatus?.data?.proxyActionStatus?.queuedAt,
      },
      refreshedCredentials,
      credits: 25,
    }
  }
}
