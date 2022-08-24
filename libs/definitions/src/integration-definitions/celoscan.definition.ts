import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

export class CeloscanDefinition extends SingleIntegrationDefinition {
  integrationKey = 'celoscan'
  integrationVersion = '1'
  schemaUrl = null

  async updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    const etherscanScehma = await OpenApiUtils.getLocalIntegrationSchema('etherscan', '1')
    schema.paths = etherscanScehma!.paths
    for (const pathKey of Object.keys(schema.paths)) {
      const replaceKeys = ['summary', 'description', 'x-triggerSummary', 'x-triggerDescription']
      for (const key of replaceKeys) {
        if (schema.paths[pathKey].get[key]) {
          console.log(`replacing ${key} for ${pathKey}`)
          schema.paths[pathKey].get[key] = schema.paths[pathKey].get[key].replace('Ether ', 'CELO ')
        }
      }
    }
    return schema
  }
}
