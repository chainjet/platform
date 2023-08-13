import { BaseResolver } from '@app/common/base/base.resolver'
import { BadRequestException, Logger, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { WriteError } from 'mongodb'
import { ObjectId } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { ResultPayload } from '../../users/payloads/user.payloads'
import { UserService } from '../../users/services/user.service'
import { Contact } from '../entities/contact'
import { ContactService } from '../services/contact.service'

@Resolver(() => Contact)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Contact))
export class ContactResolver extends BaseResolver(Contact, {
  // CreateDTOClass: CreateUserDatabaseInput,
  // UpdateDTOClass: UpdateUserDatabaseInput,
  guards: [GraphqlGuard],
}) {
  private readonly logger = new Logger(ContactResolver.name)

  constructor(
    protected contactService: ContactService,
    @InjectAuthorizer(Contact) readonly authorizer: Authorizer<Contact>,
    protected userService: UserService,
  ) {
    super(contactService)
  }

  @Mutation(() => ResultPayload)
  async addContacts(
    @UserId() userId: ObjectId,
    @Args({ name: 'addresses', type: () => [GraphQLString] }) addresses: string[],
    @Args({ name: 'tags', type: () => [GraphQLString], nullable: true }) tags?: string[],
  ): Promise<ResultPayload> {
    if (!userId) {
      throw new UnauthorizedException('Not logged in')
    }
    if (!addresses || addresses.length === 0) {
      throw new BadRequestException('Addresses cannot be empty')
    }
    if (addresses.some((address) => !address || !isAddress(address))) {
      throw new BadRequestException(
        `Address ${addresses.find((address) => !address || !isAddress(address))} is not valid`,
      )
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException('User not found')
    }
    const total = await this.contactService.countNative({ owner: user._id })
    if (total + addresses.length > user.planConfig.maxContacts) {
      throw new BadRequestException(
        `Your current plan only allows you to have ${user.planConfig.maxContacts} contacts. Please upgrade to add more.`,
      )
    }
    const contacts = addresses.map((address) => ({
      owner: user._id,
      address,
      tags: tags?.map((tag) => tag.toString()),
    }))

    // create contacts in bulk
    const duplicatedAddresses: string[] = []
    try {
      await this.contactService.insertMany(contacts, { ordered: false })
    } catch (e) {
      if (e.writeErrors && e.insertedIds) {
        for (const error of e.writeErrors as WriteError[]) {
          if (error.code === 11000) {
            duplicatedAddresses.push(getAddress(addresses[error.index]))
          }
        }
      }
    }

    // for contacts that already existed, add the tags
    let updatedContacts = 0
    if (duplicatedAddresses.length && tags?.length) {
      const res = await this.contactService.updateManyNative(
        { address: { $in: duplicatedAddresses }, owner: user._id },
        { $addToSet: { tags: { $each: tags } } },
      )
      updatedContacts = res.modifiedCount
    }

    this.logger.log(
      `Added ${addresses.length - duplicatedAddresses.length} contacts and updated ${updatedContacts} for ${user.id}`,
    )

    return {
      success: true,
    }
  }
}
