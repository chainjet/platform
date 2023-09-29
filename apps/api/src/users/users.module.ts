import { CommonModule } from '@app/common'
import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { EmailsModule } from '../../../../libs/emails/src'
import { AuthModule } from '../auth/auth.module'
import { User } from './entities/user'
import { CoreContactResolver } from './resolvers/core-contact.resolver'
import { MigrationResolver } from './resolvers/migration.resolver'
import { UserAuthorizer } from './resolvers/user.authorizer'
import { UserResolver } from './resolvers/user.resolver'
import { CoreContactService } from './services/core-contact.service'
import { UserService } from './services/user.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([User])],
      dtos: [{ DTOClass: User }],
    }),
    AuthModule, // required for GraphqlGuard
    EmailsModule,
    CommonModule,
  ],
  providers: [UserResolver, UserService, UserAuthorizer, MigrationResolver, CoreContactService, CoreContactResolver],
  exports: [UserService],
})
export class UsersModule {}
