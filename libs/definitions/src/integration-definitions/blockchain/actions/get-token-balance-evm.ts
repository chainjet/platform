import { onChainNetworkField } from '@app/definitions/contants/fields'
import { ArgsEvm, MutabilityEvm, OperationEvm } from '@app/definitions/operation-evm'
import { hasInterpolation } from '@app/definitions/utils/interpolation.utils'
import { getAddress } from 'ethers/lib/utils'
import { JSONSchema7 } from 'json-schema'

export default class GetTokenBalanceEvmAction extends OperationEvm {
  key = 'getTokenBalanceEvm'
  name = 'Get Token Balance'
  description = 'Get the balance of a wallet or contract on a ERC20 token'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'tokenAddress'],
    properties: {
      network: onChainNetworkField,
      tokenAddress: {
        title: 'Token Address',
        type: 'string',
        format: 'solidity:address',
      },
      balanceOfAddress: {
        title: 'Balance Of Address',
        type: 'string',
        format: 'solidity:address',
        description: 'The address to get the balance of. If empty, it will get the balance of the current contract.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      balance: {
        type: 'string',
        format: 'solidity:uint256',
      },
    },
  }

  template(inputs: Record<string, any>) {
    const args: ArgsEvm = []
    let tokenAdress: string
    if (hasInterpolation(inputs.tokenAddress)) {
      tokenAdress = '_token'
      args.push({ type: 'address', name: '_token' })
    } else {
      tokenAdress = getAddress(inputs.tokenAddress)
    }
    let balanceOfAddress: string
    if (!inputs.balanceOfAddress) {
      balanceOfAddress = 'address(this)'
    } else if (hasInterpolation(inputs.balanceOfAddress)) {
      balanceOfAddress = '_balanceOf'
      args.push({ type: 'address', name: '_balanceOf' })
    } else {
      balanceOfAddress = getAddress(inputs.balanceOfAddress)
    }

    return {
      imports: ['@openzeppelin/contracts/token/ERC20/IERC20.sol'],
      code: `
      uint256 balance = IERC20(${tokenAdress}).balanceOf(${balanceOfAddress});
      `,
      mutability: MutabilityEvm.View,
      args,
    }
  }
}
