import { BaseResolver } from '@app/common/base/base.resolver'
import { Logger, NotFoundException, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { ObjectId } from 'bson'
import { Types } from 'mongoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { UpdateUserInput, User } from '../entities/user'
import { GenerateApiTokenPayload } from '../payloads/user.payloads'
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

  @Mutation(() => User)
  @UseGuards(GraphqlGuard)
  async changePassword(
    @UserId() userId: Types.ObjectId,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<User> {
    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException()
    }
    if (await this.userService.passwordIsValid(user, oldPassword)) {
      await this.userService.updateById(userId, {
        password: await SecurityUtils.hashWithBcrypt(newPassword, 12),
      })
      return user
    }
    throw new Error('Old password is not correct.')
  }

  @Mutation(() => GenerateApiTokenPayload)
  @UseGuards(GraphqlGuard)
  async generateApiKey(@UserId() userId: ObjectId): Promise<GenerateApiTokenPayload> {
    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException('User not found')
    }

    this.logger.log(`Generating api token for ${user.username}`)

    const apiKey = SecurityUtils.generateRandomString(48)
    await this.userService.updateById(userId, { apiKey })
    return {
      apiKey: `${user.username}:${apiKey}`,
    }
  }
}
