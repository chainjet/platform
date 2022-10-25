import { HttpModule } from '@nestjs/axios'
import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { SessionModule } from 'nestjs-session'
import { EmailsModule } from '../../../../libs/emails/src'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { AuthController } from './controllers/auth.controller'
import { ExternalOAuthController } from './external-oauth/controllers/external-oauth.controller'
import { OAuthStrategyFactory } from './external-oauth/oauth-strategy.factory'
import { AuthService } from './services/auth.service'
import { OwnershipService } from './services/ownership.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,

    // Sessions are required for passport-oauth1
    SessionModule.forRoot({
      // An empty string will make the sesion fail if for some reason a secret is not defined
      session: { secret: process.env.SESSION_SECRET ?? '' },
    }),

    forwardRef(() => UsersModule),
    forwardRef(() => AccountCredentialsModule),
    IntegrationsModule,
    IntegrationAccountsModule,
    EmailsModule,
  ],
  providers: [AuthService, OwnershipService, OAuthStrategyFactory],
  controllers: [ExternalOAuthController, AuthController],
  exports: [AuthService, OAuthStrategyFactory],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(OAuthStrategyFactory.initializePassport()).forRoutes(ExternalOAuthController)
  }
}
