import { Test, TestingModule } from '@nestjs/testing'
import { AsyncSchemaResolver } from './async-schema.resolver'

describe('AsyncSchemaResolver', () => {
  let resolver: AsyncSchemaResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsyncSchemaResolver],
    }).compile()

    resolver = module.get<AsyncSchemaResolver>(AsyncSchemaResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
