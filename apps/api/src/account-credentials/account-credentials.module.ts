import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RunnerModule } from '../../../runner/src/runner.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { AccountCredential } from './entities/account-credential'
import { AccountCredentialAuthorizer, AccountCredentialResolver } from './resolvers/account-credentials.resolver'
import { AccountCredentialService } from './services/account-credentials.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([AccountCredential])],
      resolvers: [],
    }),
    UsersModule, // required for GraphqlGuard
    IntegrationsModule,
    IntegrationAccountsModule,
    forwardRef(() => RunnerModule),
  ],
  providers: [AccountCredentialResolver, AccountCredentialService, AccountCredentialAuthorizer],
  exports: [AccountCredentialService],
})
export class AccountCredentialsModule {}
