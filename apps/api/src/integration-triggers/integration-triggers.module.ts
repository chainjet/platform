import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { Module } from '@nestjs/common'
import { IntegrationTrigger } from './entities/integration-trigger'
import { IntegrationTriggerResolver } from './resolvers/integration-trigger.resolver'
import { IntegrationTriggerService } from './services/integration-trigger.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationTrigger])],
      resolvers: []
    })
  ],
  providers: [IntegrationTriggerResolver, IntegrationTriggerService],
  exports: [IntegrationTriggerService]
})
export class IntegrationTriggersModule {}
