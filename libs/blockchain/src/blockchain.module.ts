import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { blockchainConfigList, BlockchainConfigService } from './blockchain.config'
import { BlockchainService } from './blockchain.service'
import { EvmContract } from './contract/entities/evm-contracts'
import { ContractService } from './contract/services/contract.service'
import { EvmContractService } from './contract/services/evm-contract.service'
import { ExplorerService } from './explorer/explorer.service'
import { MulticallService } from './multicall/multicall.service'
import { ProviderService } from './provider/provider.service'
import { ChainJetRunnerService } from './runner/chainjet-runner.service'

@Module({
  imports: [
    ConfigModule.forRoot({ load: [blockchainConfigList] }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([EvmContract])],
      dtos: [{ DTOClass: EvmContract }],
    }),
  ],
  providers: [
    BlockchainService,
    ExplorerService,
    ProviderService,
    BlockchainConfigService,
    MulticallService,
    ContractService,
    ChainJetRunnerService,
    EvmContractService,
  ],
  exports: [
    BlockchainService,
    ExplorerService,
    ProviderService,
    MulticallService,
    ChainJetRunnerService,
    EvmContractService,
  ],
})
export class BlockchainModule {}
