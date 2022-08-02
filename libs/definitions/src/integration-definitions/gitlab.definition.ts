import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationObject } from 'openapi3-ts'

export class GitlabDefinition extends SingleIntegrationDefinition {
  integrationKey = 'gitlab'
  integrationVersion = '3'
  schemaUrl = 'https://api.apis.guru/v2/specs/gitlab.com/v3/swagger.json'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    if (!operationSchema.operationId) {
      throw new Error('Operation must have an operationId')
    }
    const summary = operationSchema.operationId
      .replace('getV3', 'Get ')
      .replace('postV3', 'Create ')
      .replace('putV3', 'Update ')
      .replace('deleteV3', 'Delete ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim()
    return {
      ...operationSchema,
      summary,
      description: operationSchema.description ?? operationSchema.summary,
    }
  }
}
