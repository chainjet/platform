import { Test, TestingModule } from '@nestjs/testing'
import { OwnershipService } from './ownership.service'

describe('OwnershipService', () => {
  let service: OwnershipService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OwnershipService]
    }).compile()

    service = module.get<OwnershipService>(OwnershipService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
