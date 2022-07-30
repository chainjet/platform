import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class AppveyorDefinition extends SingleIntegrationDefinition {
  integrationKey = 'appveyor'
  integrationVersion = '1'

  // The unofficial spec is not maintained, let's keep ours
  schemaUrl = '' // 'https://raw.githubusercontent.com/kevinoid/appveyor-swagger/master/swagger.yaml'
}
