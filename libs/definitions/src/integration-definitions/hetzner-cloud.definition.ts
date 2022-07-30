import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class HetznerCloudDefinition extends SingleIntegrationDefinition {
  integrationKey = 'hetzner-cloud'
  integrationVersion = '1'
  schemaUrl = 'https://raw.githubusercontent.com/MaximilianKoestler/hcloud-openapi/master/openapi/hcloud.json'
}
