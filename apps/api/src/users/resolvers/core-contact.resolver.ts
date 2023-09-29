import { NotFoundException, UseGuards } from '@nestjs/common'
import { Args, Field, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { Types } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { ResultPayload } from '../payloads/user.payloads'
import { CoreContactService } from '../services/core-contact.service'
import { UserService } from '../services/user.service'

@ObjectType('ViewerContact')
export class ViewerContactDto {
  @Field({ nullable: true })
  notificationAddress?: string

  @Field()
  subscribedNewsletter: boolean

  @Field()
  subscribedNotifications: boolean
}

@Resolver('ViewerContact')
export class CoreContactResolver {
  constructor(private coreContactService: CoreContactService, private userService: UserService) {}

  @Query(() => ViewerContactDto)
  @UseGuards(GraphqlGuard)
  async viewerContact(@UserId() userId: Types.ObjectId): Promise<ViewerContactDto | null> {
    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }
    const coreContract = await this.coreContactService.findOne({
      address: user.address,
    })
    return {
      notificationAddress: coreContract?.notificationAddress,
      subscribedNewsletter: coreContract?.subscribedNewsletter ?? true,
      subscribedNotifications: coreContract?.subscribedNotifications ?? true,
    }
  }

  @Mutation(() => ResultPayload)
  @UseGuards(GraphqlGuard)
  async updateViewerContact(
    @UserId() userId: Types.ObjectId,
    @Args('notificationAddress', { nullable: true }) notificationAddress?: string,
    @Args('subscribedNewsletter', { nullable: true }) subscribedNewsletter?: boolean,
    @Args('subscribedNotifications', { nullable: true }) subscribedNotifications?: boolean,
  ): Promise<ResultPayload> {
    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }
    if (
      !notificationAddress &&
      typeof subscribedNewsletter === 'undefined' &&
      typeof subscribedNotifications === 'undefined'
    ) {
      throw new NotFoundException(`Nothing to update`)
    }
    await this.coreContactService.updateOne(user.address, {
      notificationAddress,
      subscribedNewsletter,
      subscribedNotifications,
    })
    return {
      success: true,
    }
  }
}
