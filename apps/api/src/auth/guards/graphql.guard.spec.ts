import { Test, TestingModule } from '@nestjs/testing'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { GraphqlGuard } from './graphql.guard'

describe('GraphqlGuard', () => {
  let guard: GraphqlGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MockModule
      ],
      providers: []
    }).compile()

    guard = module.get<GraphqlGuard>(GraphqlGuard)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })
})
