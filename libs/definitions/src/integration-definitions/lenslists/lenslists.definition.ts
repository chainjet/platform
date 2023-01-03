import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RequestInterceptorOptions } from '@app/definitions'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import request from 'request'
import { refreshLensAccessToken } from '../lens/lens.common'

export class LensListsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'lenslists'
  integrationVersion = '1'
  schemaUrl = null

  createOrUpdateIntegrationAccount(): Promise<IntegrationAccount | null> {
    return IntegrationAccountService.instance.findOne({
      key: 'lens',
    })
  }

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    // refresh credentials
    if (!opts.credentials?.refreshToken || !opts.credentials?.profileId) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    const refreshedCredentials = await refreshLensAccessToken(opts.credentials.refreshToken)
    if (!refreshedCredentials) {
      throw new AuthenticationError('Authentication is expired, please connect the profile again')
    }
    return {
      ...opts,
      credentials: refreshedCredentials,
    }
  }

  requestInterceptor({ req, credentials }: RequestInterceptorOptions): request.OptionsWithUrl {
    req.headers = req.headers || {}
    req.headers['x-access-token'] = credentials.accessToken
    return req
  }
}
