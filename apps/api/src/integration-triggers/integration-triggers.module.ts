import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { IntegrationTrigger } from './entities/integration-trigger'
import { IntegrationTriggerResolver } from './resolvers/integration-trigger.resolver'
import { IntegrationTriggerAuthorizer, IntegrationTriggerService } from './services/integration-trigger.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationTrigger])],
      resolvers: [],
    }),
  ],
  providers: [IntegrationTriggerResolver, IntegrationTriggerService, IntegrationTriggerAuthorizer],
  exports: [IntegrationTriggerService],
})
export class IntegrationTriggersModule {}
