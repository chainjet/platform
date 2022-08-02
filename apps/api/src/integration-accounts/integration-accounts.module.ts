import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { Module } from '@nestjs/common'
import { IntegrationAccount } from './entities/integration-account'
import { IntegrationAccountResolver } from './resolvers/integration-account.resolver'
import { IntegrationAccountService } from './services/integration-account.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([IntegrationAccount])],
      resolvers: [],
    }),
  ],
  providers: [IntegrationAccountResolver, IntegrationAccountService],
  exports: [IntegrationAccountService],
})
export class IntegrationAccountsModule {}
