import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { blockchainConfigList, BlockchainConfigService } from '../blockchain.config'
import { ContractService } from '../contract/contract.service'
import { ProviderService } from '../provider/provider.service'
import { ExplorerService } from './explorer.service'

describe('ExplorerService', () => {
  let service: ExplorerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [blockchainConfigList] })],
      providers: [ExplorerService, BlockchainConfigService, ContractService, ProviderService],
    }).compile()

    service = testModule.get<ExplorerService>(ExplorerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
