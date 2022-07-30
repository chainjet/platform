import { CeloProvider } from '@celo-tools/celo-ethers-wrapper'
import { Injectable } from '@nestjs/common'
import { ethers } from 'ethers'
import { BlockchainConfig } from '../blockchain.config'
import { ChainId } from '../types/ChainId'

@Injectable()
export class ProviderService {
  static instance: ProviderService

  constructor(private blockchainConfig: BlockchainConfig) {
    ProviderService.instance = this
  }

  getReadOnlyProvider(chainId: ChainId) {
    const config = this.blockchainConfig.get(chainId)
    if (!config?.url) {
      throw new Error(`Configuration for network ${chainId} not found`)
    }
    if (chainId === ChainId.CELO) {
      return new CeloProvider(config.url)
    }
    return new ethers.providers.JsonRpcProvider(config.url)
  }

  // getSignedProvider(chainId: ChainId, account: keyof NamedAccount) {
  //   const provider = this.getReadOnlyProvider(chainId)
  //   const pk = this.configService.get(`accounts.${account}`)
  //   if (chainId === ChainId.CELO) {
  //     return new CeloWallet(pk, provider)
  //   }
  //   return new ethers.Wallet(pk, provider)
  // }

  // signMessage(chainId: ChainId, account: keyof NamedAccount, message: string) {
  //   const provider = this.getSignedProvider(chainId, account)
  //   return provider.signMessage(ethers.utils.arrayify(message))
  // }

  // getAddress(chainId: ChainId, account: keyof NamedAccount) {
  //   const provider = this.getSignedProvider(chainId, account)
  //   return provider.address
  // }
}
