import { mongoForRoot } from '@app/common/utils/mongodb'
import { BlockchainModule } from '@blockchain/blockchain'
import { blockchainConfigList, BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ContractService } from '@blockchain/blockchain/contract/services/contract.service'
import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { ContractResolver } from './contract.resolver'

describe('ContractResolver', () => {
  let resolver: ContractResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [blockchainConfigList] }), mongoForRoot(), BlockchainModule],
      providers: [ContractResolver, ExplorerService, BlockchainConfigService, ContractService],
    }).compile()

    resolver = testModule.get<ContractResolver>(ContractResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
