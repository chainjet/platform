import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { ethers } from 'ethers'
import { JSONSchema7 } from 'json-schema'
import { BLOCKCHAIN_INPUTS } from '../blockchain.common'

export class GetNativeBalanceAction extends OperationOffChain {
  key = 'getNativeBalance'
  name = 'Get Native Balance'
  description = 'Get the native currency balance of a wallet (i.e. ETH on the Ethereum)'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'balanceOfAddress'],
    properties: {
      network: BLOCKCHAIN_INPUTS.network,
      balanceOfAddress: {
        title: 'Balance Of Address',
        type: 'string',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      balance: { type: 'string' },
      convertedBalance: { type: 'integer' },
      symbol: { type: 'string' },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const provider = ProviderService.instance.getReadOnlyProvider(Number(inputs.network))
    const balance = await provider.getBalance(inputs.balanceOfAddress)
    return {
      outputs: {
        balance: balance.toString(),
        convertedBalance: ethers.utils.formatUnits(balance),
        symbol: BlockchainConfigService.instance.get(Number(inputs.network)).nativeSymbol,
      },
    }
  }
}
