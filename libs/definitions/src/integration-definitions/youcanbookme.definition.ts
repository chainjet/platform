import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { getQueryParam } from '../../../common/src/utils/url.utils'

export class YoucanbookmeDefinition extends SingleIntegrationDefinition {
  integrationKey = 'youcanbookme'
  integrationVersion = '1'
  schemaUrl = 'https://api.youcanbook.me/v1/api-docs?group=api'

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    if (!opts.inputs.accountId) {
      opts.inputs.accountId = opts.credentials.username
    }

    // Accept profile ID or url
    if (opts.inputs.profileId?.includes('://')) {
      opts.inputs.profileId = getQueryParam(opts.inputs.profileId, 'id')
    }

    return opts
  }
}
