import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { GetTokenPriceAction } from './actions/get-token-price.action'
import { TokenPriceChangeThresholdTrigger } from './triggers/token-price-change-threshold.trigger'
import { TokenPriceThresholdTrigger } from './triggers/token-price-threshold.trigger'

export class PricesDefinition extends SingleIntegrationDefinition {
  integrationKey = 'prices'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new TokenPriceThresholdTrigger(), new TokenPriceChangeThresholdTrigger()]
  actions = [new GetTokenPriceAction()]
}
