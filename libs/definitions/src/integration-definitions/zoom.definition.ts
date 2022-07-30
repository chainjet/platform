import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class ZoomDefinition extends SingleIntegrationDefinition {
  integrationKey = 'zoom'
  integrationVersion = '2' // 2.0.0
  schemaUrl = 'https://raw.githubusercontent.com/zoom/api/master/openapi.v2.json'
}
