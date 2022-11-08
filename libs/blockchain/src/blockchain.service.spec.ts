import { Test, TestingModule } from '@nestjs/testing'
import { BlockchainService } from './blockchain.service'

describe('BlockchainService', () => {
  let service: BlockchainService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile()

    service = testModule.get<BlockchainService>(BlockchainService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
