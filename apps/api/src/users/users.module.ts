import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { EmailsModule } from '../../../../libs/emails/src'
import { User } from './entities/user'
import { UserProvider } from './entities/user-provider'
import { UserAuthorizer } from './resolvers/user.authorizer'
import { UserResolver } from './resolvers/user.resolver'
import { UserProviderService } from './services/user-provider.service'
import { UserService } from './services/user.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([User, UserProvider])],
      resolvers: [],
    }),
    EmailsModule,
  ],
  providers: [UserResolver, UserService, UserAuthorizer, UserProviderService],
  exports: [UserService, UserProviderService],
})
export class UsersModule {}
