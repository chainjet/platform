import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'

export class MakerlogDefinition extends SingleIntegrationDefinition {
  integrationKey = 'makerlog'
  integrationVersion = '1'
  schemaUrl = 'https://api.getmakerlog.com/v1/docs/?format=openapi'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    return {
      ...operationSchema,
      summary: operationSchema.summary ?? operationSchema.operationId?.replace(/_/g, ' '),
    }
  }

  updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    schema.security = [
      {
        OAuth2: [],
      },
    ]
    return Promise.resolve(schema)
  }
}
