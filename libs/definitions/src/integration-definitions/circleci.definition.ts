import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationObject } from 'openapi3-ts'

export class CircleciDefinition extends SingleIntegrationDefinition {
  integrationKey = 'circleci'
  integrationVersion = '2'
  schemaUrl = 'https://circleci.com/api/v2/openapi.json'

  mapSchemaOperation (operationSchema: OperationObject): OperationObject {
    if (!operationSchema.operationId) {
      throw new Error('Operation must include operationId')
    }
    return {
      ...operationSchema,
      summary: operationSchema.operationId,
      description: operationSchema.description ?? operationSchema.summary
    }
  }
}
