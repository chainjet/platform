import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { AccountCredential } from '../entities/account-credential'
import { AccountCredentialService } from '../services/account-credentials.service'
import { AccountCredentialAuthorizer, AccountCredentialResolver } from './account-credentials.resolver'

describe('AccountCredentialResolver', () => {
  let resolver: AccountCredentialResolver
  let mock: MockService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([AccountCredential]), MockModule],
      providers: [AccountCredentialResolver, AccountCredentialService, AccountCredentialAuthorizer],
    }).compile()

    resolver = module.get<AccountCredentialResolver>(AccountCredentialResolver)
    mock = module.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
