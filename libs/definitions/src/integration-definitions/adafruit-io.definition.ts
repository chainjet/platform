import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class AdafruitIoDefinition extends SingleIntegrationDefinition {
  integrationKey = 'adafruit-io'
  integrationVersion = '2'
  schemaUrl = 'https://raw.githubusercontent.com/adafruit/io-api/gh-pages/v2.json'
}
