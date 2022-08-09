import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'

export class CoinbaseDefinition extends SingleIntegrationDefinition {
  integrationKey = 'coinbase'
  integrationVersion = '2'
  schemaUrl = null // 'https://raw.githubusercontent.com/CoinFabrik/coinbase-api-swagger/99612bd8f30f009d329b2e636b27841c1c69022c/swagger.json'
}
