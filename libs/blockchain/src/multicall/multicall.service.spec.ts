import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import { blockchainConfigList, BlockchainConfigService } from '../blockchain.config'
import { ProviderService } from '../provider/provider.service'
import { MulticallService } from './multicall.service'

describe('MulticallService', () => {
  let service: MulticallService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [blockchainConfigList] })],
      providers: [MulticallService, BlockchainConfigService, ProviderService],
    }).compile()

    service = testModule.get<MulticallService>(MulticallService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
