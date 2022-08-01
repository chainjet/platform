import { Test, TestingModule } from '@nestjs/testing'
import { MulticallService } from './multicall.service'

describe('MulticallService', () => {
  let service: MulticallService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MulticallService],
    }).compile()

    service = module.get<MulticallService>(MulticallService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
