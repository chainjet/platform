import { BaseService } from '@app/common/base/base.service'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'bson'
import { InjectModel } from 'nestjs-typegoose'
import { Profile } from 'passport'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { EmailVerificationTemplate } from '../../../../../libs/emails/src/templates/emailVerificationTemplate'
import { LoginProvider } from '../../auth/external-oauth/login-strategies/LoginProviderStrategy'
import { User } from '../entities/user'
import { UserProviderService } from './user-provider.service'

@Injectable()
export class UserService extends BaseService<User> {
  protected readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel(User) protected readonly model: ReturnModelType<typeof User>,
    private readonly userProviderService: UserProviderService,
    private readonly emailService: EmailService,
  ) {
    super(model)
  }

  findOneByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    return emailOrUsername.includes('@')
      ? this.findOne({ email: emailOrUsername })
      : this.findOne({ username: emailOrUsername })
  }

  async incrementOperationsUsed(userId: ObjectId): Promise<void> {
    await this.updateById(userId, {
      $inc: {
        operationsUsedMonth: 1,
        operationsUsedTotal: 1,
      },
    })
  }

  async updateOne(id: string, record: DeepPartial<User>, opts?: UpdateOneOptions<User>): Promise<User> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException()
    }

    // If the email was changed send a new verification email and mark the user as not verified
    if (record.email && record.email !== user.email) {
      const plainVerificationToken = await this.generateAndSaveVerificationToken(user)
      const template = new EmailVerificationTemplate(user.username, plainVerificationToken)
      await this.emailService.sendEmailTemplate(template, record.email)
    }

    return await super.updateOne(id, record, opts)
  }

  async passwordIsValid(user: User, password: string): Promise<boolean> {
    return !!password && !!user?.password && (await SecurityUtils.bcryptHashIsValid(password, user.password))
  }

  async generateAndSaveVerificationToken(user: User): Promise<string> {
    const plainVerificationToken = SecurityUtils.generateRandomString(48)
    const verificationToken = await SecurityUtils.hashWithBcrypt(plainVerificationToken, 12)
    await this.updateOne(user.id, { verificationToken, verified: false })
    return plainVerificationToken
  }

  async createOrUpdateAccountFromLoginProvider(
    user: User | null,
    providerKey: LoginProvider,
    profile: Profile,
    primaryEmail: { value: string; verified?: boolean } | null,
  ): Promise<{ userProviderId: string; completeAuthCode: string }> {
    const completeAuthCode = SecurityUtils.generateRandomString(48)
    const emailIsVerified = primaryEmail?.value && primaryEmail.verified !== false
    let provider
    if (user) {
      provider = await this.userProviderService.findOne({ user: user._id, provider: providerKey })
    } else if (emailIsVerified) {
      provider = await this.userProviderService.findOne({ provider: providerKey, primaryEmail: primaryEmail?.value })
    }
    if (provider) {
      await this.userProviderService.updateById(provider._id, { completeAuthCode })
    } else {
      provider = await this.userProviderService.createOne({
        user: user?._id,
        provider: providerKey,
        primaryEmail: emailIsVerified ? primaryEmail?.value : undefined,
        profileId: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        name: profile.name,
        emails: profile.emails,
        photos: profile.photos,
        completeAuthCode,
      })
    }
    if (user && !user.verified && emailIsVerified) {
      await this.updateById(user._id, { verified: true })
    }

    return {
      userProviderId: provider.id,
      completeAuthCode,
    }
  }

  async completeProviderAuth(
    userProviderId: string,
    code: string,
    username?: string,
    email?: string,
  ): Promise<{ user: User; isNew: boolean }> {
    const userProvider = await this.userProviderService.findById(userProviderId)
    if (!code || !userProvider || userProvider.completeAuthCode !== code) {
      throw new BadRequestException('Authentication code is invalid or it has expired. Please try again.')
    }
    await this.userProviderService.updateById(userProvider._id, { completeAuthCode: undefined })
    if (userProvider.user) {
      const user = await this.findById(userProvider.user.toString())
      if (!user) {
        throw new NotFoundException('User not found')
      }
      return { user, isNew: false }
    }
    const userEmail = email ?? userProvider.primaryEmail
    if (username && userEmail) {
      const providerEmail = userProvider.emails?.find((email) => email.value === userEmail)
      const emailIsVerified = providerEmail && providerEmail.verified !== false
      const user = await this.createOne({
        username,
        email: userEmail,
        verified: emailIsVerified,
        name: userProvider.displayName ?? `${userProvider.name?.givenName} ${userProvider.name?.familyName}`.trim(),
      })
      await this.userProviderService.updateOne(userProvider.id, { user: user._id })
      return { user, isNew: true }
    }
    throw new BadRequestException('Missing username or email.')
  }
}
