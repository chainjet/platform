import { APIREUM_NETWORK_FIELD } from '@app/definitions/contants/fields'
import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import fetch from 'node-fetch'

export class TokenPriceThresholdTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'tokenPriceThreshold'
  name = 'Token Price Threshold'
  description =
    'Triggers when a token price is above/below a given threshold. The workflow is triggered once and disabled.'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'address', 'threshold', 'direction'],
    properties: {
      network: APIREUM_NETWORK_FIELD,
      address: {
        title: 'Token address',
        type: 'string',
      },
      threshold: {
        title: 'Price Threshold',
        type: 'number',
      },
      direction: {
        title: 'Trigger when the price is above or below the threshold',
        type: 'string',
        oneOf: [
          { title: 'Above Threshold', const: 'above' },
          { title: 'Below Threshold', const: 'below' },
        ],
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      price: {
        title: 'Price',
        type: 'number',
      },
      priceChange24h: {
        title: 'Price Change 24h',
        type: 'number',
      },
      priceChange24hText: {
        title: 'Price Change 24h (text)',
        type: 'string',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    const url = `https://api.apireum.com/v1/price/${inputs.network}/${inputs.address}?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const json = await res.json()
    const data = json.data
    if (
      (data.price > inputs.threshold && inputs.direction === 'above') ||
      (data.price < inputs.threshold && inputs.direction === 'below')
    ) {
      return {
        outputs: {
          items: [
            {
              id: Date.now(),
              price: data.price,
              priceChange24h: data.priceChange24h,
              priceChange24hText: `${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h}%`,
            },
          ],
        },
        nextCheck: null, // disables the workflow
      }
    }
    return {
      outputs: {},
    }
  }
}
