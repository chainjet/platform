import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { Integration } from './entities/integration'
import { IntegrationAuthorizer, IntegrationResolver } from './resolvers/integration.resolver'
import { IntegrationService } from './services/integration.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Integration])],
      dtos: [{ DTOClass: Integration }],
    }),
  ],
  providers: [IntegrationResolver, IntegrationService, IntegrationAuthorizer],
  exports: [IntegrationService],
})
export class IntegrationsModule {}
