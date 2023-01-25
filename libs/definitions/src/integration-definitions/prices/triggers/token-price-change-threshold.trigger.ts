import { APIREUM_NETWORK_FIELD } from '@app/definitions/contants/fields'
import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import fetch from 'node-fetch'

export class TokenPriceChangeThresholdTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'tokenPriceChangeThreshold'
  name = 'Token Price Change Threshold'
  description =
    'Triggers when the price change of a token in the last 24 hours is above/below a given threshold. The workflow is triggered up to 1 time every 24hs.'
  version = '1.1.0'

  inputs: JSONSchema7 = {
    required: ['network', 'address', 'threshold'],
    properties: {
      network: APIREUM_NETWORK_FIELD,
      address: {
        title: 'Token address',
        type: 'string',
      },
      threshold: {
        title: 'Move percentage to trigger the workflow',
        type: 'number',
        description: 'The threshold in percentage (e.g. 5 for 5%/-5%)',
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
    if (Math.abs(data.priceChange24h) > inputs.threshold) {
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
        nextCheck: new Date(Date.now() + 1000 * 60 * 60 * 24), // check again in 24 hours
      }
    }
    return {
      outputs: {},
    }
  }
}
