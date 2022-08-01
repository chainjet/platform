import { ConfigModule } from '@nestjs/config'
import { Test, TestingModule } from '@nestjs/testing'
import blockchainConfig from './libs/blockchain/src/config/blockchain'
import { ProviderService } from './provider.service'

describe('ProviderService', () => {
  let service: ProviderService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ load: [blockchainConfig] })],
      providers: [ProviderService],
    }).compile()

    service = module.get<ProviderService>(ProviderService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
