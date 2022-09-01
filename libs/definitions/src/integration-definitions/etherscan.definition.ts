import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'

export class EtherscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'etherscan'
  integrationVersion = '1'
  schemaUrl = null

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    if (!opts.credentials.token) {
      opts.credentials.token = process.env.ETHERSCAN_KEY
    }
    return opts
  }
}
