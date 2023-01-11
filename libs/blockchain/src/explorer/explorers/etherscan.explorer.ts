import { HttpException, HttpStatus } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import fetch from 'node-fetch'
import { BlockchainExplorer } from './blockchain-explorer'

export class EtherScanExplorer extends BlockchainExplorer {
  private baseUrl: string
  private apiUrl: string
  private apiKey: string

  constructor({ baseUrl, apiKey, apiUrl }: { baseUrl: string; apiKey: string; apiUrl?: string }) {
    super()
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.apiUrl = apiUrl || `https://api.${baseUrl}/api`
  }

  async getAbi(address: string): Promise<ContractAbi> {
    const response = await fetch(
      `${this.apiUrl}?module=contract&action=getabi&address=${address}&apikey=${this.apiKey}`,
    )

    if (response.status >= 400) {
      throw new HttpException(response.statusText, response.status)
    }

    const data = await response.json()
    if (data.status !== '1') {
      throw new HttpException(data.result, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return JSON.parse(data.result)
  }

  getTransactionUrl(txHash: string): string {
    return `https://${this.baseUrl}/tx/${txHash}`
  }
}
