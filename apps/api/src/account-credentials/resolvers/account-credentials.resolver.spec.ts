import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { AccountCredential, AccountCredentialAuthorizer } from '../entities/account-credential'
import { AccountCredentialService } from '../services/account-credentials.service'
import { AccountCredentialResolver } from './account-credentials.resolver'

describe('AccountCredentialResolver', () => {
  let resolver: AccountCredentialResolver
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([AccountCredential])],
          dtos: [{ DTOClass: AccountCredential }],
        }),
        MockModule,
      ],
      providers: [AccountCredentialResolver, AccountCredentialService, AccountCredentialAuthorizer],
    }).compile()

    resolver = testModule.get<AccountCredentialResolver>(AccountCredentialResolver)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
