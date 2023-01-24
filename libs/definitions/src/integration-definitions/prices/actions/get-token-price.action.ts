import { APIREUM_NETWORK_FIELD } from '@app/definitions/contants/fields'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class GetTokenPriceAction extends OperationOffChain {
  key = 'getTokenPrice'
  name = 'Get Token Price'
  description = 'Get token price by address'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['network', 'address'],
    properties: {
      network: APIREUM_NETWORK_FIELD,
      address: {
        title: 'Address',
        type: 'string',
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

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const url = `https://api.apireum.com/v1/price/${inputs.network}/${inputs.address}?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const json = await res.json()
    const data = json.data
    if (!data.price) {
      throw new Error(`Price not found for ${inputs.address} on chain ID ${inputs.network}`)
    }
    return {
      outputs: {
        price: data.price,
        priceChange24h: data.priceChange24h,
        priceChange24hText: `${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h}%`,
      },
    }
  }
}
