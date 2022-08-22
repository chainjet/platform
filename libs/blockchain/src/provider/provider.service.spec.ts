import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { blockchainConfigList, BlockchainConfigService } from '../blockchain.config'
import { ProviderService } from './provider.service'

describe('ProviderService', () => {
  let service: ProviderService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [blockchainConfigList] })],
      providers: [ProviderService, BlockchainConfigService],
    }).compile()

    service = testModule.get<ProviderService>(ProviderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
