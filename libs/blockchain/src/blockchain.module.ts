import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { blockchainConfigList, BlockchainConfigService } from './blockchain.config'
import { BlockchainService } from './blockchain.service'
import { ContractService } from './contract/contract.service'
import { ExplorerService } from './explorer/explorer.service'
import { MulticallService } from './multicall/multicall.service'
import { ProviderService } from './provider/provider.service'

@Module({
  imports: [ConfigModule.forRoot({ load: [blockchainConfigList] })],
  providers: [
    BlockchainService,
    ExplorerService,
    ProviderService,
    BlockchainConfigService,
    MulticallService,
    ContractService,
  ],
  exports: [BlockchainService, ExplorerService, ProviderService, MulticallService],
})
export class BlockchainModule {}
