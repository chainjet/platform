import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { RunnerModule } from '../../../runner/src/runner.module'
import { AuthModule } from '../auth/auth.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { AccountCredential, AccountCredentialAuthorizer } from './entities/account-credential'
import { AccountCredentialResolver } from './resolvers/account-credentials.resolver'
import { AccountCredentialService } from './services/account-credentials.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([AccountCredential])],
      dtos: [{ DTOClass: AccountCredential }],
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    IntegrationsModule,
    IntegrationAccountsModule,
    forwardRef(() => RunnerModule),
  ],
  providers: [AccountCredentialResolver, AccountCredentialService, AccountCredentialAuthorizer],
  exports: [AccountCredentialService],
})
export class AccountCredentialsModule {}
