import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class BttcscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'bttcscan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    for (const pathKey of Object.keys(schema.paths)) {
      const replaceKeys = ['summary', 'description', 'x-triggerSummary', 'x-triggerDescription']
      for (const key of replaceKeys) {
        if (schema.paths[pathKey].get[key]) {
          schema.paths[pathKey].get[key] = schema.paths[pathKey].get[key].replace('BTT ', 'BNB ')
        }
      }
    }
    return schema
  }

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    if (!opts.credentials.token) {
      opts.credentials.token = process.env.BTTCSCAN_KEY
    }
    return opts
  }
}
