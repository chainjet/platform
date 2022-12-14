import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { mongoForRoot } from '@app/common/utils/mongodb'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { blockchainConfigList, BlockchainConfigService } from '../blockchain.config'
import { EvmContract } from '../contract/entities/evm-contracts'
import { ContractService } from '../contract/services/contract.service'
import { EvmContractService } from '../contract/services/evm-contract.service'
import { ProviderService } from '../provider/provider.service'
import { ExplorerService } from './explorer.service'

describe('ExplorerService', () => {
  let service: ExplorerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [blockchainConfigList] }),
        mongoForRoot(),
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([EvmContract])],
          dtos: [{ DTOClass: EvmContract }],
        }),
      ],
      providers: [ExplorerService, BlockchainConfigService, ContractService, ProviderService, EvmContractService],
    }).compile()

    service = testModule.get<ExplorerService>(ExplorerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
