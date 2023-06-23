import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { UserDatabase } from '../entities/user-database'
import { UserDatabaseService } from '../services/user-database.service'

@Resolver(() => UserDatabase)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(UserDatabase))
export class UserDatabaseResolver extends BaseResolver(UserDatabase, {
  // CreateDTOClass: CreateUserDatabaseInput,
  // UpdateDTOClass: UpdateUserDatabaseInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected userDatabaseService: UserDatabaseService,
    @InjectAuthorizer(UserDatabase) readonly authorizer: Authorizer<UserDatabase>,
  ) {
    super(userDatabaseService)
  }
}
