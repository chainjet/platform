import { BaseResolver } from '@app/common/base/base.resolver'
import { SubscriptionService } from '@app/common/subscriptions/subscription.service'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { Logger, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { getAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { UpdateUserInput, User } from '../entities/user'
import { ResultPayload, UserCheckoutSessionPayload, VerifyEmailPayload } from '../payloads/user.payloads'
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

  constructor(
    protected readonly userService: UserService,
    protected readonly subscriptionService: SubscriptionService,
  ) {
    super(userService)
  }

  @Query(() => User)
  @UseGuards(GraphqlGuard)
  viewer(@UserId() userId: Types.ObjectId): Promise<User | null> {
    return this.userService.findOne({ _id: userId })
  }

  @Mutation(() => UserCheckoutSessionPayload)
  async createCheckoutSession(
    @UserId() userId: ObjectId,
    @Args({ name: 'priceId', type: () => GraphQLString }) priceId: string,
  ): Promise<{ sessionId: string }> {
    if (!userId) {
      throw new Error('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new Error('User not found')
    }
    this.logger.log(`Creating checkout session for user ${user.id} with price ${priceId}`)
    const successUrl = `${process.env.FRONTEND_ENDPOINT}/dashboard`
    const cancelUrl = `${process.env.FRONTEND_ENDPOINT}/dashboard`
    const sessionId = await this.subscriptionService.createCheckoutSession(user, priceId, successUrl, cancelUrl)
    return { sessionId }
  }

  @Mutation(() => ResultPayload)
  async resumeSubscription(@UserId() userId: ObjectId): Promise<{ success: boolean }> {
    if (!userId) {
      throw new Error('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new Error('User not found')
    }
    this.logger.log(`Resuming subscription ${user.stripeSubscriptionId} for user ${user.id}`)
    await this.subscriptionService.resumeSubscription(user)
    await this.userService.updateOneNative({ _id: user._id }, { $unset: { nextPlan: 'free' } })
    return { success: true }
  }

  @Mutation(() => ResultPayload)
  async changeSubscriptionPlan(
    @UserId() userId: ObjectId,
    @Args({ name: 'priceId', type: () => GraphQLString }) priceId: string,
  ): Promise<{ success: boolean }> {
    if (!userId) {
      throw new Error('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new Error('User not found')
    }

    if (priceId === 'free') {
      this.logger.log(`Cancelling subscription ${user.stripeSubscriptionId} for user ${user.id}`)
      await this.subscriptionService.cancelSubscription(user)

      // plan won't change until the next billing cycle
      await this.userService.updateOneNative({ _id: user._id }, { nextPlan: 'free' })
      return { success: true }
    }

    this.logger.log(`Changing subscription ${user.stripeSubscriptionId} for user ${user.id} to price ${priceId}`)
    const productId = await this.subscriptionService.changeSubscription(user, priceId)
    await this.userService.updateOneNative(
      { _id: user._id },
      { plan: productId, subscriptionActive: true, $unset: { nextPlan: '' } },
    )

    return { success: true }
  }

  @Mutation(() => VerifyEmailPayload)
  async verifyEmail(
    @Args({ name: 'address', type: () => GraphQLString }) address: string,
    @Args({ name: 'code', type: () => GraphQLString }) code: string,
  ): Promise<VerifyEmailPayload> {
    const user = await this.userService.findOne({ address: getAddress(address) })
    if (!user?.verificationToken || user.verified) {
      return { error: 'Verification code is invalid or it has expired.' }
    }
    if (await SecurityUtils.bcryptHashIsValid(code, user.verificationToken)) {
      await this.userService.updateOne(user.id, { verified: true, verificationToken: undefined })
      return {}
    }
    return { error: 'Verification code is invalid or it has expired.' }
  }
}
