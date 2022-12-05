import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OptionsWithUrl } from 'request'
import { RequestInterceptorOptions } from '../definition'

export class EtherscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'etherscan'
  integrationVersion = '1'
  schemaUrl = null

  requestInterceptor({ req, credentials }: RequestInterceptorOptions): OptionsWithUrl {
    if (req.url) {
      req.url += `&apikey=${credentials.token ?? process.env.ETHERSCAN_KEY}`
    }
    return req
  }
}
