import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, OperationObject, ParameterObject } from 'openapi3-ts'

// TODO: op names

export class TrelloDefinition extends SingleIntegrationDefinition {
  integrationKey = 'trello'
  integrationVersion = '1'
  schemaUrl = 'https://developer.atlassian.com/cloud/trello/swagger.v3.json'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    if (!operationSchema.operationId) {
      throw new Error('Operation must have an operationId')
    }
    return {
      ...operationSchema,
      summary: operationSchema.summary ?? operationSchema.operationId.replace(/([a-z])([A-Z])/g, '$1 $2'),
    }
  }

  updateSchemaBeforeSave(schema: OpenAPIObject): Promise<OpenAPIObject> {
    // Filter out key/token query parameters from all operations
    const filterParams = (param: ParameterObject): boolean => {
      return param?.in !== 'query' || !['key', 'token'].includes(param.name)
    }
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      if (schema.paths[pathKey].parameters) {
        schema.paths[pathKey].parameters = schema.paths[pathKey].parameters.filter(filterParams)
      }
      for (const methodKey of Object.keys(pathValue)) {
        if (schema.paths[pathKey][methodKey].parameters) {
          schema.paths[pathKey][methodKey].parameters = schema.paths[pathKey][methodKey].parameters.filter(filterParams)
        }
      }
    }

    // Tag operations
    for (const [pathKey, pathValue] of Object.entries(schema.paths)) {
      for (const methodKey of Object.keys(pathValue)) {
        const tag = schema.tags?.find((tag) => pathKey.startsWith(`/${tag.name}`))
        if (tag?.name) {
          schema.paths[pathKey][methodKey].tags = [tag.name]
        }
      }
    }

    return Promise.resolve(schema)
  }
}
