import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationTrigger } from '../entities/integration-trigger'
import { IntegrationTriggerService } from '../services/integration-trigger.service'
import { IntegrationTriggerResolver } from './integration-trigger.resolver'

describe('IntegrationTriggerResolver', () => {
  let resolver: IntegrationTriggerResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([IntegrationTrigger])],
          dtos: [{ DTOClass: IntegrationTrigger }],
        }),
        MockModule,
      ],
      providers: [IntegrationTriggerResolver, IntegrationTriggerService],
    }).compile()

    resolver = testModule.get<IntegrationTriggerResolver>(IntegrationTriggerResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
