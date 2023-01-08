import { Injectable } from '@nestjs/common'
import { ContractAbi } from 'ethereum-types'
import { BlockchainConfigService } from '../blockchain.config'
import { ContractService } from '../contract/services/contract.service'
import { EvmContractService } from '../contract/services/evm-contract.service'
import { ChainId } from '../types/ChainId'

@Injectable()
export class ExplorerService {
  static instance: ExplorerService

  constructor(
    private blockchainConfig: BlockchainConfigService,
    private contractService: ContractService,
    private evmContractService: EvmContractService,
  ) {
    ExplorerService.instance = this
  }

  async getContractAbi(chainId: ChainId, address: string): Promise<ContractAbi | null> {
    // return cached contract abi
    const contract = await this.evmContractService.findOne({ chainId, address })
    if (contract) {
      if (this.contractService.isUpgradeable(contract.abi)) {
        const implementationAddress = await this.contractService.getImplementationAddress(
          chainId,
          address,
          contract.abi,
        )
        const implementationAbi = await this.getContractAbi(chainId, implementationAddress)
        if (implementationAbi?.length) {
          return [...contract.abi, ...implementationAbi]
        }
      }
      return contract.abi
    }

    // fetch contract abi from explorers
    const explorers = this.blockchainConfig.get(chainId).explorers
    for (let i = 0; i < explorers.length; i++) {
      try {
        const contractAbi = await explorers[i].getAbi(address)
        if (contractAbi) {
          // cache contract abi (before merging implementation of upgradeable contracts)
          await this.evmContractService.createOrUpdateOne({ chainId, address }, { chainId, address, abi: contractAbi })

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
