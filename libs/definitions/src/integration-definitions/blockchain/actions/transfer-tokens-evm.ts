import { onChainNetworkField } from '@app/definitions/contants/fields'
import { MutabilityEvm, OperationEvm, VarEvm } from '@app/definitions/operation-evm'
import { parseAddressType, parseUint256Type } from '@app/definitions/utils/field.utils'
import { JSONSchema7 } from 'json-schema'

export default class TransferTokensEvmAction extends OperationEvm {
  key = 'transferTokensEvm'
  name = 'Transfer Tokens'
  description = 'Transfer ERC20 tokens from one address to another'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['network', 'tokenAddress', 'toAddress', 'amount'],
    properties: {
      network: onChainNetworkField,
      tokenAddress: {
        title: 'Token Address',
        type: 'string',
        format: 'solidity:address',
      },
      fromAddress: {
        title: 'From Address',
        type: 'string',
        description:
          'The address to transfer the tokens from. If empty, tokens will be transfer from the current contract.',
        format: 'solidity:address',
      },
      toAddress: {
        title: 'To Address',
        type: 'string',
        format: 'solidity:address',
      },
      amount: {
        title: 'Amount',
        type: 'string',
        description: 'The amount of tokens to transfer in wei',
        format: 'solidity:uint256',
      },
    },
  }

  template(inputs: Record<string, any>, usedVars: VarEvm[]) {
    const tokenAdress = parseAddressType(inputs.tokenAddress, 'token', usedVars)
    const fromAddress = parseAddressType(inputs.fromAddress || 'address(this)', 'from', usedVars)
    const toAddress = parseAddressType(inputs.toAddress, 'to', usedVars)
    const amount = parseUint256Type(inputs.amount, 'amount', usedVars)
    const args: VarEvm[] = [...tokenAdress.args, ...fromAddress.args, ...toAddress.args, ...amount.args]

    let code: string
    if (fromAddress.value.trim() === 'address(this)') {
      code = `IERC20(${tokenAdress.value}).transfer(${toAddress.value}, ${amount.value});`
    } else {
      code = `IERC20(${tokenAdress.value}).transferFrom(${fromAddress.value}, ${toAddress.value}, ${amount.value});`
    }

    return {
      imports: ['@openzeppelin/contracts/token/ERC20/IERC20.sol'],
      code,
      mutability: MutabilityEvm.Modify,
      args,
      vars: [],
    }
  }
}
