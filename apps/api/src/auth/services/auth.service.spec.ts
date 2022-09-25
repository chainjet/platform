import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [MockModule],
      providers: [AuthService],
    }).compile()

    service = testModule.get<AuthService>(AuthService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
