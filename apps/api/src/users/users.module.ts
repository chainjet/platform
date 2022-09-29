import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { EmailsModule } from '../../../../libs/emails/src'
import { AuthModule } from '../auth/auth.module'
import { User } from './entities/user'
import { MigrationResolver } from './resolvers/migration.resolver'
import { UserAuthorizer } from './resolvers/user.authorizer'
import { UserResolver } from './resolvers/user.resolver'
import { UserService } from './services/user.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([User])],
      dtos: [{ DTOClass: User }],
    }),
    AuthModule, // required for GraphqlGuard
    EmailsModule,
  ],
  providers: [UserResolver, UserService, UserAuthorizer, MigrationResolver],
  exports: [UserService],
})
export class UsersModule {}
