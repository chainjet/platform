import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationObject } from 'openapi3-ts'

// TODO installation fails

export class KubernetesDefinition extends SingleIntegrationDefinition {
  integrationKey = 'kubernetes'
  integrationVersion = '1'
  schemaUrl = 'https://raw.githubusercontent.com/kubernetes/kubernetes/master/api/openapi-spec/swagger.json'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    return {
      ...operationSchema,
      summary: operationSchema.description ?? operationSchema.operationId,
      description: undefined,
    }
  }
}
