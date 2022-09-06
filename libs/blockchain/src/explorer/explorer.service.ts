import { Injectable } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import { BlockchainConfigService } from '../blockchain.config'
import { ContractService } from '../contract/contract.service'
import { ChainId } from '../types/ChainId'

@Injectable()
export class ExplorerService {
  static instance: ExplorerService

  constructor(private blockchainConfig: BlockchainConfigService, private contractService: ContractService) {
    ExplorerService.instance = this
  }

  async getContractAbi(chainId: ChainId, address: string): Promise<ContractAbi | null> {
    const explorers = this.blockchainConfig.get(chainId).explorers
    for (let i = 0; i < explorers.length; i++) {
      try {
        const contractAbi = await explorers[i].getAbi(address)
        if (contractAbi) {
          if (this.contractService.isUpgradeable(contractAbi)) {
            const implementationAddress = await this.contractService.getImplementationAddress(
              chainId,
              address,
              contractAbi,
            )
            const implementationAbi = await this.getContractAbi(chainId, implementationAddress)
            if (implementationAbi?.length) {
              return [...contractAbi, ...implementationAbi]
            }
          }
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
