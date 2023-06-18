import { Test, TestingModule } from '@nestjs/testing'
import { AiResolver } from './ai.resolver'

describe('AiResolver', () => {
  let resolver: AiResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [AiResolver],
    }).compile()

    resolver = testModule.get<AiResolver>(AiResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
