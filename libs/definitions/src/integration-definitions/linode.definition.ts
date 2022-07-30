import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

// TODO oauth2 is ignored

export class LinodeDefinition extends SingleIntegrationDefinition {
  integrationKey = 'linode'
  integrationVersion = '4'
  schemaUrl = 'https://developers.linode.com/api/docs/v4/openapi.yaml'
}
