import { Test, TestingModule } from '@nestjs/testing'
import { BlockchainListenerService } from './blockchain-listener.service'

describe('BlockchainListenerService', () => {
  let service: BlockchainListenerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainListenerService],
    }).compile()

    service = module.get<BlockchainListenerService>(BlockchainListenerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
