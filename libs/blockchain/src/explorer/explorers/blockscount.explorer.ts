import { HttpException, HttpStatus } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import { BlockchainExplorer } from './blockchain-explorer'

export class BlockScoutExplorer extends BlockchainExplorer {
  private baseUrl: string
  private apiUrl: string

  constructor({ baseUrl, apiUrl }: { baseUrl: string; apiUrl: string }) {
    super()
    this.baseUrl = baseUrl
    this.apiUrl = apiUrl
  }

  async getAbi(address: string): Promise<ContractAbi> {
    const response = await fetch(`${this.apiUrl}?module=contract&action=getabi&address=${address}`)

    if (response.status >= 400) {
      throw new HttpException(response.statusText, response.status)
    }

    const data = await response.json()
    if (data.status !== '1') {
      throw new HttpException(data.message, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return JSON.parse(data.result)
  }

  getTransactionUrl(txHash: string): string {
    return `https://${this.baseUrl}/tx/${txHash}`
  }
}
