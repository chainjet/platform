import { forwardRef, HttpModule, MiddlewareConsumer, Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { SessionModule } from 'nestjs-session'
import { EmailsModule } from '../../../../libs/emails/src'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { ProjectsModule } from '../projects/projects.module'
import { UsersModule } from '../users/users.module'
import { ExternalOAuthController } from './external-oauth/controllers/external-oauth.controller'
import { OAuthStrategyFactory } from './external-oauth/oauth-strategy.factory'
import { AuthResolver } from './resolvers/auth.resolver'
import { AuthService } from './services/auth.service'
import { JwtStrategy } from './services/jwt.strategy'
import { OwnershipService } from './services/ownership.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET')
        }
      }
    }),

    // Sessions are required for passport-oauth1
    SessionModule.forRoot({
      // An empty string will make the sesion fail if for some reason a secret is not defined
      session: { secret: process.env.SESSION_SECRET ?? '' }
    }),

    UsersModule,
    forwardRef(() => AccountCredentialsModule),
    ProjectsModule,
    IntegrationAccountsModule,
    EmailsModule
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, OwnershipService, OAuthStrategyFactory],
  controllers: [ExternalOAuthController],
  exports: [AuthService, OAuthStrategyFactory]
})
export class AuthModule {
  configure (consumer: MiddlewareConsumer): void {
    consumer
      .apply(OAuthStrategyFactory.initializePassport())
      .forRoutes(ExternalOAuthController)
  }
}
