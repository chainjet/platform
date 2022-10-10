import { CeloProvider, CeloWallet } from '@celo-tools/celo-ethers-wrapper'
import { Injectable } from '@nestjs/common'
import { ethers } from 'ethers'
import { BlockchainConfigService } from '../blockchain.config'
import { ChainId } from '../types/ChainId'

@Injectable()
export class ProviderService {
  static instance: ProviderService
  private readProviders: { [key: number]: ethers.providers.JsonRpcProvider } = {}

  constructor(private blockchainConfig: BlockchainConfigService) {
    ProviderService.instance = this
  }

  getReadOnlyProvider(chainId: ChainId) {
    if (this.readProviders[chainId]) {
      return this.readProviders[chainId]
    }
    const config = this.blockchainConfig.get(chainId)
    if (!config?.url) {
      throw new Error(`Configuration for network ${chainId} not found`)
    }
    if (chainId === ChainId.CELO) {
      this.readProviders[ChainId.CELO] = new CeloProvider(config.url)
      return this.readProviders[ChainId.CELO]
    }
    this.readProviders[chainId] = new ethers.providers.JsonRpcProvider(config.url)
    return this.readProviders[chainId]
  }

  getSignedProvider(chainId: ChainId, privateKey: string) {
    const provider = this.getReadOnlyProvider(chainId)
    if (chainId === ChainId.CELO) {
      return new CeloWallet(privateKey, provider)
    }
    return new ethers.Wallet(privateKey, provider)
  }

  // signMessage(chainId: ChainId, account: keyof NamedAccount, message: string) {
  //   const provider = this.getSignedProvider(chainId, account)
  //   return provider.signMessage(ethers.utils.arrayify(message))
  // }

  // getAddress(chainId: ChainId, account: keyof NamedAccount) {
  //   const provider = this.getSignedProvider(chainId, account)
  //   return provider.address
  // }
}
