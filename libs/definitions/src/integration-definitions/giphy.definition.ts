import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class GiphyDefinition extends SingleIntegrationDefinition {
  integrationKey = 'giphy'
  integrationVersion = '1'
  schemaUrl = 'https://raw.githubusercontent.com/faragorn/open-api-specs/master/specs/giphy_api/1.0/index.yml'
}
