import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { RequestInterceptorOptions } from '../definition'
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

  requestInterceptor({ req, credentials }: RequestInterceptorOptions): OptionsWithUrl {
    if (req.url) {
      req.url += `&apikey=${credentials.token ?? process.env.BTTCSCAN_KEY}`
    }
    return req
  }
}
