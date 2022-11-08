import { Test, TestingModule } from '@nestjs/testing'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { GraphqlGuard } from './graphql.guard'

describe('GraphqlGuard', () => {
  let guard: GraphqlGuard

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [MockModule],
      providers: [],
    }).compile()

    guard = testModule.get<GraphqlGuard>(GraphqlGuard)
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })
})
