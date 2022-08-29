import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

// TODO installation fails

export class SendgridDefinition extends SingleIntegrationDefinition {
  integrationKey = 'sendgrid'
  integrationVersion = '3'
  schemaUrl = 'https://api.apis.guru/v2/specs/sendgrid.com/3.0/openapi.json'
}
