import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { IntegrationAction } from './entities/integration-action'
import { IntegrationActionResolver } from './resolvers/integration-action.resolver'
import { IntegrationActionAuthorizer, IntegrationActionService } from './services/integration-action.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAction])],
      resolvers: [],
    }),
  ],
  providers: [IntegrationActionResolver, IntegrationActionService, IntegrationActionAuthorizer],
  exports: [IntegrationActionService],
})
export class IntegrationActionsModule {}
