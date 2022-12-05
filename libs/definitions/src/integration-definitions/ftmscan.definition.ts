import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { OpenAPIObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { RequestInterceptorOptions } from '../definition'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class FtmscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'ftmscan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    for (const pathKey of Object.keys(schema.paths)) {
      const replaceKeys = ['summary', 'description', 'x-triggerSummary', 'x-triggerDescription']
      for (const key of replaceKeys) {
        if (schema.paths[pathKey].get[key]) {
          schema.paths[pathKey].get[key] = schema.paths[pathKey].get[key].replace('Ether ', 'FTM ')
        }
      }
    }
    return schema
  }

  requestInterceptor({ req, credentials }: RequestInterceptorOptions): OptionsWithUrl {
    if (req.url) {
      req.url += `&apikey=${credentials.token ?? process.env.FTMSCAN_KEY}`
    }
    return req
  }
}
