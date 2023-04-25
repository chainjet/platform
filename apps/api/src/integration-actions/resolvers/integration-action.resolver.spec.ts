import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationAction } from '../entities/integration-action'
import { IntegrationActionService } from '../services/integration-action.service'
import { IntegrationActionResolver } from './integration-action.resolver'

describe('IntegrationActionResolver', () => {
  let resolver: IntegrationActionResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAction]), TestDatabaseModule],
          dtos: [{ DTOClass: IntegrationAction }],
        }),
        MockModule,
      ],
      providers: [IntegrationActionResolver, IntegrationActionService],
    }).compile()

    resolver = testModule.get<IntegrationActionResolver>(IntegrationActionResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
