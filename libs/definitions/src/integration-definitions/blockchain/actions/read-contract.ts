import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { MethodAbi } from 'ethereum-types'
import { ethers } from 'ethers'
import { JSONSchema7 } from 'json-schema'

export class ReadContractAction extends OperationOffChain {
  key = 'readContract'
  name = 'Read Contract'
  description = 'Make a call to read from a smart contract'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['network', 'address'],
    properties: {
      network: {
        title: 'Network',
        $ref: '#/components/parameters/network/schema',
      },
      address: {
        title: 'Contract Address',
        $ref: '#/components/parameters/address/schema',
      },
    },
  }

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const provider = ProviderService.instance.getReadOnlyProvider(Number(inputs.network))
    const abi = await ExplorerService.instance.getContractAbi(Number(inputs.network), inputs.address.toString())
    if (!abi) {
      throw new Error(`ABI not found for ${inputs.address} on chain ${inputs.network}`)
    }
    const contract = new ethers.Contract(inputs.address, abi, provider)
    const abiMethod = abi.find((method: MethodAbi) => method.name === inputs.operation) as MethodAbi
    const res = await contract[inputs.operation](...abiMethod.inputs.map((input) => inputs[input.name]))
    const outputValues = abiMethod.outputs.length === 1 ? [res] : res

    const outputs = abiMethod.outputs.reduce((acc, output, index) => {
      let name = output.name
      if (!name) {
        name = abiMethod.outputs.length === 1 ? abiMethod.name : `output${index}`
      }
      acc[name] = outputValues[index]
      return acc
    }, {})

    return {
      outputs,
    }
  }
}
