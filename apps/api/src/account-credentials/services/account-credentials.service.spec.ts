import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { AccountCredential } from '../entities/account-credential'
import { AccountCredentialService } from './account-credentials.service'

describe('AccountCredentialService', () => {
  let service: AccountCredentialService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([AccountCredential]), MockModule],
      providers: [AccountCredentialService],
    }).compile()

    service = testModule.get<AccountCredentialService>(AccountCredentialService)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
