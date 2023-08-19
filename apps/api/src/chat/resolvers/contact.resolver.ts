import { BaseResolver } from '@app/common/base/base.resolver'
import { getLensProfileId } from '@app/definitions/integration-definitions/lens/lens.common'
import { LensLib } from '@app/definitions/integration-definitions/lens/lens.lib'
import { PoapLib } from '@app/definitions/integration-definitions/poap/poap.lib'
import { XmtpLib } from '@app/definitions/integration-definitions/xmtp/xmtp.lib'
import { getXmtpContacts } from '@chainjet/tools/dist/messages'
import { BadRequestException, Logger, UnauthorizedException, UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { ObjectId } from 'mongoose'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { IntegrationAccountService } from '../../integration-accounts/services/integration-account.service'
import { ResultPayload } from '../../users/payloads/user.payloads'
import { UserService } from '../../users/services/user.service'
import { Contact } from '../entities/contact'
import { ContactService } from '../services/contact.service'

@Resolver(() => Contact)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Contact))
export class ContactResolver extends BaseResolver(Contact, {
  guards: [GraphqlGuard],
  enableTotalCount: true,
}) {
  private readonly logger = new Logger(ContactResolver.name)

  constructor(
    protected contactService: ContactService,
    @InjectAuthorizer(Contact) readonly authorizer: Authorizer<Contact>,
    protected userService: UserService,
    protected integrationAccountService: IntegrationAccountService,
    protected accountCredentialsService: AccountCredentialService,
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
    this.logger.log(`Importing ${addresses.length} addresses - user ${user.id}`)
    await this.contactService.addContacts(addresses, user, tags)
    return {
      success: true,
    }
  }

  @Mutation(() => ResultPayload)
  async importXmtpContacts(
    @UserId() userId: ObjectId,
    @Args({ name: 'tags', type: () => [GraphQLString], nullable: true }) tags?: string[],
  ) {
    if (!userId) {
      throw new UnauthorizedException('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException('User not found')
    }
    this.logger.log(`Importing XMTP contacts - user ${user.id}`)

    const xmtp = await this.integrationAccountService.findOne({ key: 'xmtp' })
    const account = await this.accountCredentialsService.findOne({ owner: userId, integrationAccount: xmtp!._id })
    if (!account) {
      throw new BadRequestException('Credentials for XMTP not found')
    }
    const client = await XmtpLib.getClient(account.credentials.keys)
    const addresses = await getXmtpContacts(client)
    await this.contactService.addContacts(addresses, user, tags)
    return {
      success: true,
    }
  }

  @Mutation(() => ResultPayload)
  async importPoapContacts(
    @UserId() userId: ObjectId,
    @Args({ name: 'eventId', type: () => GraphQLString }) eventId: string,
    @Args({ name: 'tags', type: () => [GraphQLString], nullable: true }) tags?: string[],
  ) {
    if (!userId) {
      throw new UnauthorizedException('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException('User not found')
    }
    this.logger.log(`Importing POAP ${eventId} - user ${user.id}`)

    const tokens = await PoapLib.fetchAllEventTokens(eventId)
    const holders = new Set<string>()
    for (const token of tokens) {
      holders.add(getAddress(token.owner))
    }
    const addresses = Array.from(holders)
    await this.contactService.addContacts(addresses, user, tags)
    return {
      success: true,
    }
  }

  @Mutation(() => ResultPayload)
  async importLensFollowersContacts(
    @UserId() userId: ObjectId,
    @Args({ name: 'handle', type: () => GraphQLString }) handle: string,
    @Args({ name: 'tags', type: () => [GraphQLString], nullable: true }) tags?: string[],
  ) {
    if (!userId) {
      throw new UnauthorizedException('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException('User not found')
    }
    this.logger.log(`Importing Lens followers ${handle} - user ${user.id}`)

    const profileId = await getLensProfileId(handle)
    const followers = await LensLib.fetchAllFollowers(profileId)
    const ids = new Set<string>()
    for (const follower of followers) {
      ids.add(getAddress(follower.id))
    }
    const addresses = Array.from(ids)
    await this.contactService.addContacts(addresses, user, tags)
    return {
      success: true,
    }
  }

  @Mutation(() => ResultPayload)
  async importLensCollectorsContacts(
    @UserId() userId: ObjectId,
    @Args({ name: 'publicationId', type: () => GraphQLString }) publicationId: string,
    @Args({ name: 'tags', type: () => [GraphQLString], nullable: true }) tags?: string[],
  ) {
    if (!userId) {
      throw new UnauthorizedException('Not logged in')
    }
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new BadRequestException('User not found')
    }
    this.logger.log(`Importing Lens collectors ${publicationId} - user ${user.id}`)

    const collectors = await LensLib.fetchAllCollectors(publicationId)
    const ids = new Set<string>()
    for (const collector of collectors) {
      ids.add(getAddress(collector.address))
    }
    const addresses = Array.from(ids)
    await this.contactService.addContacts(addresses, user, tags)
    return {
      success: true,
    }
  }
}
