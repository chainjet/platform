import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { Module } from '@nestjs/common'
import { Integration } from './entities/integration'
import { IntegrationResolver } from './resolvers/integration.resolver'
import { IntegrationService } from './services/integration.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Integration])],
      resolvers: []
    })
  ],
  providers: [IntegrationResolver, IntegrationService],
  exports: [IntegrationService]
})
export class IntegrationsModule {}
