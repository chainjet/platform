import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { IntegrationAccount } from './entities/integration-account'
import { IntegrationAccountResolver } from './resolvers/integration-account.resolver'
import { IntegrationAccountAuthorizer, IntegrationAccountService } from './services/integration-account.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAccount])],
      resolvers: [],
    }),
  ],
  providers: [IntegrationAccountResolver, IntegrationAccountService, IntegrationAccountAuthorizer],
  exports: [IntegrationAccountService],
})
export class IntegrationAccountsModule {}
