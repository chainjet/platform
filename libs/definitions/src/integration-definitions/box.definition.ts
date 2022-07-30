import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class BoxDefinition extends SingleIntegrationDefinition {
  integrationKey = 'box'
  integrationVersion = '2'
  schemaUrl = 'https://raw.githubusercontent.com/box/box-openapi/en/openapi.json'
}
