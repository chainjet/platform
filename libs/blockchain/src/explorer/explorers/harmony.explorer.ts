import { HttpException } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import { BlockchainExplorer } from './blockchain-explorer'

export class HarmonyExplorer extends BlockchainExplorer {
  constructor(private apiUrl: string) {
    super()
  }

  async getAbi(address: string): Promise<ContractAbi> {
    const response = await fetch(`${this.apiUrl}fetchContractCode?contractAddress=${address}`)

    if (response.status >= 400) {
      throw new HttpException(response.statusText, response.status)
    }

    return (await response.json()).abi
  }
}
