import { onChainNetworkField } from '@app/definitions/contants/fields'
import { MutabilityEvm, OperationEvm, VarEvm } from '@app/definitions/operation-evm'
import { hasInterpolation } from '@app/definitions/utils/field.utils'
import { getAddress } from 'ethers/lib/utils'
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

  template(inputs: Record<string, any>) {
    const args: VarEvm[] = []
    let tokenAdress: string
    if (hasInterpolation(inputs.tokenAddress)) {
      tokenAdress = '_token'
      args.push({ type: 'address', name: '_token' })
    } else {
      tokenAdress = getAddress(inputs.tokenAddress)
    }
    let fromAddress: string
    if (!inputs.fromAddress) {
      fromAddress = 'address(this)'
    } else if (hasInterpolation(inputs.fromAddress)) {
      fromAddress = '_from'
      args.push({ type: 'address', name: '_from' })
    } else {
      fromAddress = getAddress(inputs.fromAddress)
    }
    let toAddress: string
    if (hasInterpolation(inputs.toAddress)) {
      toAddress = '_to'
      args.push({ type: 'address', name: '_to' })
    } else {
      toAddress = getAddress(inputs.toAddress)
    }
    let amount: string
    if (hasInterpolation(inputs.amount)) {
      amount = '_amount'
      args.push({ type: 'uint256', name: '_amount' })
    } else {
      amount = inputs.amount
    }

    return {
      imports: ['@openzeppelin/contracts/token/ERC20/IERC20.sol'],
      code: `
      IERC20(${tokenAdress}).transferFrom(${fromAddress}, ${toAddress}, ${amount});
      `,
      mutability: MutabilityEvm.Modify,
      args,
      vars: [],
    }
  }
}
