import { Injectable } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import { BlockchainConfigService } from '../blockchain.config'
import { ChainId } from '../types/ChainId'

@Injectable()
export class ExplorerService {
  static instance: ExplorerService

  constructor(private blockchainConfig: BlockchainConfigService) {
    ExplorerService.instance = this
  }

  async getContractAbi(chainId: ChainId, address: string): Promise<ContractAbi | null> {
    const explorers = this.blockchainConfig.get(chainId).explorers
    for (let i = 0; i < explorers.length; i++) {
      try {
        const contractAbi = await explorers[i].getAbi(address)
        if (contractAbi) {
          return contractAbi
        }
      } catch (e) {
        if (i === explorers.length - 1) {
          if (e.message?.toLowerCase().includes('apikey')) {
            throw new Error(`Error fetching contract from blockchain explorer.`)
          }
          throw e
        }
      }
    }
    return null
  }
}
