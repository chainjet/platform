import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { UserDatabase, UserDatabaseAuthorizer } from './entities/user-database'
import { UserDatabaseItem, UserDatabaseItemAuthorizer } from './entities/user-database-item'
import { UserDatabaseItemResolver } from './resolvers/user-database-item.resolver'
import { UserDatabaseResolver } from './resolvers/user-database.resolver'
import { UserDatabaseItemService } from './services/user-database-item.service'
import { UserDatabaseService } from './services/user-database.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([UserDatabase])],
      dtos: [{ DTOClass: UserDatabase }],
    }),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([UserDatabaseItem])],
      dtos: [{ DTOClass: UserDatabaseItem }],
    }),
    AuthModule, // required for GraphqlGuard
    UsersModule, // required for GraphqlGuard
  ],
  providers: [
    UserDatabaseResolver,
    UserDatabaseItemResolver,
    UserDatabaseService,
    UserDatabaseItemService,
    UserDatabaseAuthorizer,
    UserDatabaseItemAuthorizer,
  ],
  exports: [UserDatabaseService, UserDatabaseItemService],
})
export class UserDatabaseModule {}
