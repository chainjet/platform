import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class GumroadDefinition extends SingleIntegrationDefinition {
  integrationKey = 'gumroad'
  integrationVersion = '2'
  schemaUrl = 'https://raw.githubusercontent.com/flowoid/gumroad-openapi/main/gumroad.openapi.json'

  preferExternalSchema = true // TODO
}
