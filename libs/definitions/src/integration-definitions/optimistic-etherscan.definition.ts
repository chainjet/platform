import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class OptimisticEtherscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'optimistic-etherscan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    return schema
  }

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    if (!opts.credentials.token) {
      opts.credentials.token = process.env.OPTIMISTIC_ETHERSCAN_KEY
    }
    return opts
  }
}
