import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { UserDatabaseItem } from '../entities/user-database-item'
import { UserDatabaseItemService } from '../services/user-database-item.service'

@Resolver(() => UserDatabaseItem)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(UserDatabaseItem))
export class UserDatabaseItemResolver extends BaseResolver(UserDatabaseItem, {
  // CreateDTOClass: CreateUserDatabaseItemInput,
  // UpdateDTOClass: UpdateUserDatabaseItemInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected userDatabaseItemService: UserDatabaseItemService,
    @InjectAuthorizer(UserDatabaseItem) readonly authorizer: Authorizer<UserDatabaseItem>,
  ) {
    super(userDatabaseItemService)
  }
}
