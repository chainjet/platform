import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { OperationObject } from 'openapi3-ts'

// TODO naming, integration account

// https://www.twilio.com/docs/api

export class TwilioDefinition extends SingleIntegrationDefinition {
  integrationKey = 'twilio'
  integrationVersion = '2010-04-01'
  schemaUrl = 'https://api.apis.guru/v2/specs/twilio.com/2010-04-01/swagger.json'

  mapSchemaOperation (operationSchema: OperationObject): OperationObject {
    if (!operationSchema.description) {
      throw new Error('Operation must include description')
    }
    return {
      ...operationSchema,
      summary: operationSchema.description.replace(/\.$/, ''),
      description: undefined
    }
  }
}
