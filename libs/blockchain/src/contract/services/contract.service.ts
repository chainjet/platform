import { Injectable } from '@nestjs/common'
import { ContractAbi, MethodAbi } from 'ethereum-types'
import { ethers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { ProviderService } from '../../provider/provider.service'
import { ChainId } from '../../types/ChainId'

@Injectable()
export class ContractService {
  constructor(private providerService: ProviderService) {}

  getReadOnlyContract(chainId: ChainId, address: string, abi: ContractAbi) {
    const provider = this.providerService.getReadOnlyProvider(chainId)
    return new ethers.Contract(address, abi, provider)
  }

  isUpgradeable(abi: ContractAbi) {
    return abi.some(
      (abi: MethodAbi) =>
        abi.name?.toLowerCase() === 'implementation' && abi.outputs?.length === 1 && abi.outputs[0].type === 'address',
    )
  }

  async getImplementationAddress(chainId: ChainId, address: string, abi: ContractAbi): Promise<string> {
    const contract = this.getReadOnlyContract(chainId, address, abi)
    try {
      // some upgradeable proxies have a public implementation field with the address
      return await contract.implementation()
    } catch {
      // if the contract implementation is not public, we need to fetch it from its storage slot (https://eips.ethereum.org/EIPS/eip-1967)
      const provider = this.providerService.getReadOnlyProvider(chainId)
      // TODO this storage slot is used by OpenZeppelin implementation but other proxies might use a different one
      const storageSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
      const implementationStorage = await provider.getStorageAt(address, storageSlot)
      return getAddress('0x' + implementationStorage.slice(-40))
    }
  }
}
