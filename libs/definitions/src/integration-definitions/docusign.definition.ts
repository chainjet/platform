import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OpenAPIObject, OperationObject } from 'openapi3-ts'

// TODO account authentication

export class DocusignDefinition extends SingleIntegrationDefinition {
  integrationKey = 'docusign'
  integrationVersion = '2'
  schemaUrl =
    'https://raw.githubusercontent.com/docusign/eSign-OpenAPI-Specification/master/esignature.rest.swagger-v2.json'

  mapSchemaOperation(operationSchema: OperationObject): OperationObject {
    if (!operationSchema.operationId) {
      throw new Error('Operation must include operationId')
    }
    const summary = operationSchema.operationId.includes('_')
      ? operationSchema.operationId.split('_')[1]
      : operationSchema.operationId
    return {
      ...operationSchema,
      summary: summary.replace(/([a-z])([A-Z])/g, '$1 $2'),
      description: operationSchema.description ?? operationSchema.summary,
    }
  }

  updateSchemaAfterFetch(schema: any): OpenAPIObject {
    // offlineAttributes is intentionally not defined and is marked as 'Reserved for DocuSign.'
    // https://github.com/docusign/eSign-OpenAPI-Specification/issues/22
    delete schema.definitions.witness.properties.offlineAttributes
    return schema
  }
}
