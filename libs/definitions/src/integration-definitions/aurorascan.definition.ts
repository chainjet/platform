import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { RequestInterceptorOptions } from '../definition'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class AurorascanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'aurorascan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    return schema
  }

  requestInterceptor({ req, credentials }: RequestInterceptorOptions): OptionsWithUrl {
    if (req.url) {
      req.url += `&apikey=${credentials.token ?? process.env.AURORASCAN_KEY}`
    }
    return req
  }
}
