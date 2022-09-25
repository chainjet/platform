import { BaseResolver } from '@app/common/base/base.resolver'
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common'
import { Query, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { Types } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { UpdateUserInput, User } from '../entities/user'
import { UserService } from '../services/user.service'

@Resolver(() => User)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(User))
export class UserResolver extends BaseResolver(User, {
  guards: [GraphqlGuard],
  UpdateDTOClass: UpdateUserInput,
  read: { many: { disabled: true } },
  create: { disabled: true },
  update: { many: { disabled: true } },
  delete: { disabled: true },
}) {
  private readonly logger = new Logger(UserResolver.name)

  constructor(protected readonly userService: UserService) {
    super(userService)
  }

  @Query(() => User)
  @UseGuards(GraphqlGuard)
  viewer(@UserId() userId: Types.ObjectId): Promise<User | null> {
    return this.userService.findOne({ _id: userId })
  }
}
