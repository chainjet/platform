import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { refreshLensAccessToken } from '../lens.common'

export class FollowProfileAction extends OperationOffChain {
  key = 'followProfile'
  name = 'Follow Profile'
  description = 'Follow a lens profile'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID',
        type: 'string',
        description:
          'A Lens profile ID (e.g. 0x012cd6). See [docs](https://docs.chainjet.io/integrations/lens#how-to-get-the-profile-id.) to learn how to find it.',
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

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials?.refreshToken) {
      throw new Error('Authentication is expired, please connect the profile again')
    }
    const { profileId } = inputs
    const refreshedCredentials = await refreshLensAccessToken(credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new Error('Authentication is expired, please connect the profile again')
    }
    const query = `
    mutation ProxyAction {
      proxyAction(request: {
        follow: {
          freeFollow: {
            profileId: "${profileId}"
          }
        }
      })
    }`
    const res = await sendGraphqlQuery('https://api.lens.dev/', query, {
      'x-access-token': refreshedCredentials.accessToken,
    })
    if (!res?.data?.proxyAction) {
      if (res?.errors?.[0]?.message) {
        throw new Error(res.errors[0].message)
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
    }
  }
}
