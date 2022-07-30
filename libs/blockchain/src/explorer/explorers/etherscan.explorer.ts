import { HttpException, HttpStatus } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import fetch from 'node-fetch'
import { BlockchainExplorer } from './blockchain-explorer'

export class EtherScanExplorer extends BlockchainExplorer {
  constructor(private apiUrl: string, private apiKey: string) {
    super()
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
}
