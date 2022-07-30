import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { Module } from '@nestjs/common'
import { IntegrationAction } from './entities/integration-action'
import { IntegrationActionResolver } from './resolvers/integration-action.resolver'
import { IntegrationActionService } from './services/integration-action.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAction])],
      resolvers: []
    })
  ],
  providers: [IntegrationActionResolver, IntegrationActionService],
  exports: [IntegrationActionService]
})
export class IntegrationActionsModule {}
