import { Test, TestingModule } from '@nestjs/testing'
import { CompilerService } from './compiler.service'

describe('CompilerService', () => {
  let service: CompilerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [CompilerService],
    }).compile()

    service = testModule.get<CompilerService>(CompilerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
