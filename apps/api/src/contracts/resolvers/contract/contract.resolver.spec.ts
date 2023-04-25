import { redisForRoot } from '@app/common/utils/redis.utils'
import { BlockchainModule } from '@blockchain/blockchain'
import { blockchainConfigList, BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ContractService } from '@blockchain/blockchain/contract/services/contract.service'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { TestDatabaseModule } from 'libs/common/test/database/test-database.module'
import { ContractResolver } from './contract.resolver'

describe('ContractResolver', () => {
  let resolver: ContractResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ load: [blockchainConfigList] }),
        TestDatabaseModule,
        redisForRoot(),
        BlockchainModule,
      ],
      providers: [ContractResolver, ExplorerService, BlockchainConfigService, ContractService],
    }).compile()

    resolver = testModule.get<ContractResolver>(ContractResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
