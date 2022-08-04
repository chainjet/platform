import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, SchemaObject } from 'openapi3-ts'
import { SingleIntegrationData } from '../definition'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

// Documentation: https://coinmarketcap.com/api/documentation/v1/

export class CoinMarketCapDefinition extends SingleIntegrationDefinition {
  integrationKey = 'coinmarketcap'
  integrationVersion = '2'
  schemaUrl = 'https://pro-api.coinmarketcap.com/swagger.json'

  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    // add missing api key security schema
    schema.components = schema.components || {}
    schema.components.securitySchemes = {
      ApiKey: {
        ['x-displayName']: 'API Key',
        type: 'apiKey',
        name: 'X-CMC_PRO_API_KEY',
        in: 'header',
        description: 'Get your API Key here: https://coinmarketcap.com/api/',
      },
    }
    schema.security = [
      {
        ApiKey: [],
      },
    ]

    // The schema has objects with type = hidden, which is invalid according to the OpenAPI 3.0 spec.
    // This function replaces these types with the x-hidden property.
    const transform = (obj: SchemaObject) => {
      if (obj.type === 'hidden') {
        delete obj.type
        obj['x-hidden'] = true
      }
      return obj
    }
    return OpenApiUtils.transformAllSchemaObjects(schema, transform)
  }
}
