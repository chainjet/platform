import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, SchemaObject } from 'openapi3-ts'
import { SingleIntegrationData } from '../definition'
import { OpenApiUtils } from '../schema/utils/openApiUtils'

// Documentation: https://docs.moralis.io/introduction/readme

export class MoralisDefinition extends SingleIntegrationDefinition {
  integrationKey = 'moralis'
  integrationVersion = '2'
  schemaUrl = 'https://deep-index.moralis.io/api-docs/v2/swagger.json'

  async updateSchemaBeforeSave(schema: OpenAPIObject, integrationData: SingleIntegrationData): Promise<OpenAPIObject> {
    const transform = (obj: SchemaObject) => {
      // fix objects with missing schema
      if (obj.name === 'cursor' && !obj.schema) {
        obj.schema = { type: 'string' }
      }

      // remove 0x options from enums (the enums have the chain name and its id)
      if (obj.enum?.length) {
        console.log('has enum', obj.enum)
        obj.enum = obj.enum.filter((e) => !e.startsWith('0x'))
      }

      return obj
    }
    return OpenApiUtils.transformAllSchemaObjects(schema, transform)
  }
}
