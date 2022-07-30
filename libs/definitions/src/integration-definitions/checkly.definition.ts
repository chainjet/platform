import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class ChecklyDefinition extends SingleIntegrationDefinition {
  integrationKey = 'checkly'
  integrationVersion = '1'
  schemaUrl = 'https://api.checklyhq.com/swagger.json'
}
