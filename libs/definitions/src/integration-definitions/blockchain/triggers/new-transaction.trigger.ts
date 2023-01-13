import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { HttpException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import fetch from 'node-fetch'
import { BLOCKCHAIN_INPUTS } from '../blockchain.common'

interface Transaction {
  block_signed_at: string
  block_height: number
  tx_hash: string
  tx_offset: number
  successful: boolean
  from_address: string
  from_address_label?: string | null
  to_address: string
  to_address_label?: string | null
  value: string
  value_quote: number
  gas_offered: number
  gas_spent: number
  gas_price: number
  fees_paid: string
  gas_quote: number
  gas_quote_rate: number
}

export class NewTransactionTrigger extends OperationTrigger {
  idKey = 'items[].transactionHash'
  key = 'newTransaction'
  name = 'New transaction'
  description = 'Triggers when a given address makes a transaction'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'address'],
    properties: {
      network: BLOCKCHAIN_INPUTS.covalent_networks,
      address: {
        title: 'Wallet address',
        type: 'string',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      fromAddress: {
        title: 'From address',
        type: 'string',
      },
      fromAddressLabel: {
        title: 'From address label',
        type: 'string',
      },
      toAddress: {
        title: 'To address',
        type: 'string',
      },
      toAddressLabel: {
        title: 'To address label',
        type: 'string',
      },
      transactionHash: {
        title: 'Transaction hash',
        type: 'string',
      },
      transactionUrl: {
        title: 'Transaction URL',
        type: 'string',
      },
      transactionOffset: {
        title: 'Transaction offset',
        type: 'number',
      },
      successful: {
        title: 'Successful',
        type: 'boolean',
      },
      blockNumber: {
        title: 'Block number',
        type: 'number',
      },
      blockSignedAt: {
        title: 'Block signed at',
        type: 'string',
      },
      value: {
        title: 'Value',
        type: 'string',
      },
      valueQuote: {
        title: 'Value quote',
        type: 'number',
      },
      gasOffered: {
        title: 'Gas offered',
        type: 'number',
      },
      gasSpent: {
        title: 'Gas spent',
        type: 'number',
      },
      gasPrice: {
        title: 'Gas price',
        type: 'number',
      },
      feesPaid: {
        title: 'Fees paid',
        type: 'string',
      },
      gasQuote: {
        title: 'Gas quote',
        type: 'number',
      },
      gasQuoteRate: {
        title: 'Gas quote rate',
        type: 'number',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse | null> {
    const url = `https://api.covalenthq.com/v1/${inputs.network}/address/${inputs.address}/transactions_v2/?key=${process.env.COVALENTHQ_KEY}&no-logs=true&page-size=10`
    const res = await fetch(url)

    if (res.status >= 400) {
      throw new HttpException(res.statusText, res.status)
    }

    const data = await res.json()
    const items: Transaction[] = data?.data?.items

    if (!Array.isArray(items)) {
      throw new Error(`Unknown Error`)
    }

    return {
      outputs: {
        items: items.map((item) => ({
          fromAddress: item.from_address,
          fromAddressLabel: item.from_address_label,
          toAddress: item.to_address,
          toAddressLabel: item.to_address_label,
          transactionHash: item.tx_hash,
          transactionUrl: ExplorerService.instance.getTransactionUrl(inputs.network, item.tx_hash),
          transactionOffset: item.tx_offset,
          successful: item.successful,
          blockNumber: item.block_height,
          blockSignedAt: item.block_signed_at,
          value: item.value,
          valueQuote: item.value_quote,
          gasOffered: item.gas_offered,
          gasSpent: item.gas_spent,
          gasPrice: item.gas_price,
          feesPaid: item.fees_paid,
          gasQuote: item.gas_quote,
          gasQuoteRate: item.gas_quote_rate,
        })),
      },
    }
  }
}
