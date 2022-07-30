import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class AsanaDefinition extends SingleIntegrationDefinition {
  integrationKey = 'asana'
  integrationVersion = '1'
  schemaUrl = 'https://raw.githubusercontent.com/Asana/developer-docs/master/defs/asana_oas.yaml'
}
