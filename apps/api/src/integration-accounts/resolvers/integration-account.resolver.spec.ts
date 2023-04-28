import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationActionAuthorizer } from '../../integration-actions/services/integration-action.service'
import { IntegrationAccount } from '../entities/integration-account'
import { IntegrationAccountService } from '../services/integration-account.service'
import { IntegrationAccountResolver } from './integration-account.resolver'

describe('IntegrationAccountResolver', () => {
  let resolver: IntegrationAccountResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAccount])],
          dtos: [{ DTOClass: IntegrationAccount }],
        }),
        MockModule,
      ],
      providers: [IntegrationAccountResolver, IntegrationAccountService, IntegrationActionAuthorizer],
    }).compile()

    resolver = testModule.get<IntegrationAccountResolver>(IntegrationAccountResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
