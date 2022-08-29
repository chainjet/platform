import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

// TODO installation fails

export class ChecklyDefinition extends SingleIntegrationDefinition {
  integrationKey = 'checkly'
  integrationVersion = '1'
  schemaUrl = 'https://api.checklyhq.com/swagger.json'
}
