import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { MulticallService } from '@blockchain/blockchain/multicall/multicall.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { BigNumber, ethers } from 'ethers'
import { JSONSchema7 } from 'json-schema'

export class GetTokenBalanceAction extends OperationOffChain {
  key = 'getTokenBalance'
  name = 'Get Token Balance'
  description = 'Get the balance of a wallet or contract on a ERC20 token'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'tokenAddress', 'balanceOfAddress'],
    properties: {
      network: {
        title: 'Network',
        $ref: '#/components/parameters/network/schema',
      },
      tokenAddress: {
        title: 'Token Address',
        $ref: '#/components/parameters/address/schema',
      },
      balanceOfAddress: {
        title: 'Balance Of Address',
        $ref: '#/components/parameters/address/schema',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      balance: { type: 'string' },
      tokenDecimals: { type: 'integer' },
      convertedBalance: { type: 'integer' },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const outputs = await MulticallService.instance.callAndResolve(Number(inputs.network), [
      {
        calls: [
          {
            abi: [
              {
                constant: true,
                inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            address: inputs.tokenAddress,
            name: 'balanceOf',
            params: [inputs.balanceOfAddress],
          },
          {
            abi: [
              {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
                stateMutability: 'view',
                type: 'function',
              },
            ],
            address: inputs.tokenAddress,
            name: 'decimals',
            params: [],
          },
        ],
        resolve: (res: [[BigNumber], [number]]) => {
          return {
            balance: res[0][0].toString(),
            tokenDecimals: res[1][0],
            convertedBalance: ethers.utils.formatUnits(res[0][0], res[1][0]),
          }
        },
      },
    ])
    return {
      outputs: outputs[0],
    }
  }
}
