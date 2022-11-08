import { Test, TestingModule } from '@nestjs/testing'
import { OwnershipService } from './ownership.service'

describe('OwnershipService', () => {
  let service: OwnershipService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [OwnershipService],
    }).compile()

    service = testModule.get<OwnershipService>(OwnershipService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
