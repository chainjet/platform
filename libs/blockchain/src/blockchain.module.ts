import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BlockchainConfig, blockchainConfigList } from './blockchain.config'
import { BlockchainService } from './blockchain.service'
import { ProviderService } from './calls/provider.service'
import { ExplorerService } from './explorer/explorer.service'

@Module({
  imports: [ConfigModule.forRoot({ load: [blockchainConfigList] })],
  providers: [BlockchainService, ExplorerService, ProviderService, BlockchainConfig],
  exports: [BlockchainService, ExplorerService],
})
export class BlockchainModule {}
