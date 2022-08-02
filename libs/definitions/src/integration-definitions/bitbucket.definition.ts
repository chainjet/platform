import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationObject } from 'openapi3-ts'

export class BitbucketDefinition extends SingleIntegrationDefinition {
  integrationKey = 'bitbucket'
  integrationVersion = '2'
  schemaUrl = 'https://bitbucket.org/api/swagger.json'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    if (!operationSchema.operationId) {
      throw new Error('Operation must include operationId')
    }
    return {
      ...operationSchema,
      summary: operationSchema.operationId.replace(/([a-z])([A-Z])/g, '$1 $2'),
      description: operationSchema.description ?? operationSchema.summary,
    }
  }
}
