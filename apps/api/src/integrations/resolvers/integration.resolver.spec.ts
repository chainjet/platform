import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { Integration } from '../entities/integration'
import { IntegrationAuthorizer, IntegrationResolver } from './integration.resolver'

describe('IntegrationResolver', () => {
  let resolver: IntegrationResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([Integration])],
          dtos: [{ DTOClass: Integration }],
        }),
        MockModule,
      ],
      providers: [IntegrationResolver, IntegrationAuthorizer],
    }).compile()

    resolver = testModule.get<IntegrationResolver>(IntegrationResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
