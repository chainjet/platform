import { onChainNetworkField } from '@app/definitions/contants/fields'
import { MutabilityEvm, OperationEvm, VarEvm } from '@app/definitions/operation-evm'
import { getVarName, parseAddressType } from '@app/definitions/utils/field.utils'
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

  template(inputs: Record<string, any>, usedVars: VarEvm[]) {
    const tokenAdress = parseAddressType(inputs.tokenAddress, 'token', usedVars)
    const balanceOfAddress = parseAddressType(inputs.balanceOfAddress || 'address(this)', 'balanceOf', usedVars)
    const balanceVarName = getVarName('balance', usedVars)

    return {
      imports: ['@openzeppelin/contracts/token/ERC20/IERC20.sol'],
      code: `
      uint256 ${balanceVarName} = IERC20(${tokenAdress.value}).balanceOf(${balanceOfAddress.value});
      `,
      mutability: MutabilityEvm.View,
      args: [...tokenAdress.args, ...balanceOfAddress.args],
      vars: [{ name: 'balance', type: 'uint256' }],
    }
  }
}
