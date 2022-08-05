import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject } from 'openapi3-ts'
import { SingleIntegrationData } from '../definition'

// Documentation: https://docs.1inch.io/docs/aggregation-protocol/api/swagger

export class OneInchDefinition extends SingleIntegrationDefinition {
  integrationKey = '1inch'
  integrationVersion = '4'
  schemaUrl = 'https://api.1inch.io/swagger/ethereum-json'

  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    // 1inch has a different schema for each network, but we joined them, so we need to remove the paths and use our schema
    const pathKeys = Object.keys(schema.paths)
    for (const pathKey of pathKeys) {
      if (pathKey.includes('/1/')) {
        delete schema.paths[pathKey]
      }
    }
    return schema
  }
}
