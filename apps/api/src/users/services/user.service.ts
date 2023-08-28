import { BaseService } from '@app/common/base/base.service'
import { UserEventKey } from '@app/common/metrics/entities/user-event'
import { UserEventService } from '@app/common/metrics/user-event.service'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'bson'
import { getAddress } from 'ethers/lib/utils'
import { InjectModel } from 'nestjs-typegoose'
import { SiweMessage } from 'siwe'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { EmailVerificationTemplate } from '../../../../../libs/emails/src/templates/emailVerificationTemplate'
import { Contact } from '../../chat/entities/contact'
import { User } from '../entities/user'

@Injectable()
export class UserService extends BaseService<User> {
  protected readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel(User) protected readonly model: ReturnModelType<typeof User>,
    private readonly emailService: EmailService,
    private readonly userEventService: UserEventService,
  ) {
    super(model)
  }

  async incrementOperationsUsed(userId: ObjectId, success: boolean): Promise<void> {
    await this.updateById(userId, {
      $inc: {
        operationsUsedMonth: 1,
        operationsUsedTotal: 1,
      },
    })
    await this.userEventService.log(userId, success ? UserEventKey.OPERATION_SUCCEDED : UserEventKey.OPERATION_FAILED)
  }

  async updateOne(id: string, record: DeepPartial<User>, opts?: UpdateOneOptions<User>): Promise<User> {
    const user = await this.findById(id, opts)
    if (!user) {
      throw new NotFoundException()
    }

    // If the email was changed send a new verification email and mark the user as not verified
    if (record.email && record.email !== user.email) {
      const plainVerificationToken = await this.generateAndSaveVerificationToken(user)
      const template = new EmailVerificationTemplate(user.address, plainVerificationToken)
      await this.emailService.sendEmailTemplate(template, record.email)
    }

    // The user just joined the AI waitlist
    if (record.features?.aiwaitlist && !user.features?.aiwaitlist) {
      const workflowHook = process.env.AI_WAITLIST_WORKFLOW_HOOK
      if (workflowHook) {
        // send the promise but don't wait for it
        fetch(workflowHook, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            address: user.address,
          }),
        })
      }
    }

    return await super.updateOne(id, record, opts)
  }

  async createAccountFromSignature(message: SiweMessage, externalApp: string | null) {
    const user = await this.findOne({ address: getAddress(message.address) })
    if (user) {
      if (user.nonces?.length > 10) {
        user.nonces = user.nonces.slice(-10)
      }
      user.nonces.push(message.nonce)
      if (externalApp) {
        if (!user.externalApps) {
          user.externalApps = {}
        }
        user.externalApps[externalApp] = 1
      }
      await this.updateById(user._id, user)
    } else {
      await this.createOne({
        address: getAddress(message.address),
        nonces: [message.nonce],
        ...(externalApp && { externalApps: { [externalApp]: 1 } }),
      })
      if (process.env.SIGN_UP_WORKFLOW_HOOK) {
        await fetch(process.env.SIGN_UP_WORKFLOW_HOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ address: message.address }),
        })
      }
    }
  }

  async generateAndSaveVerificationToken(user: User): Promise<string> {
    const plainVerificationToken = SecurityUtils.generateRandomString(48)
    const verificationToken = await SecurityUtils.hashWithBcrypt(plainVerificationToken, 12)
    await this.updateOne(user.id, { verificationToken, verified: false })
    return plainVerificationToken
  }

  async addContactDataKeys(userId: ObjectId, contact: Contact[]): Promise<void> {
    const allTags = contact.flatMap((contact) => contact.tags)
    const uniqueTags = Array.from(new Set(allTags))

    const allFields = contact.flatMap((contact) => Object.keys(contact.fields ?? {}))
    const uniqueFields = Array.from(new Set(allFields))

    if (!uniqueTags.length && !uniqueFields.length) {
      return
    }

    const user = await this.findById(userId.toString())
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    const existingTags = user.contactTags ?? []
    const existingFields = user.contactFields ?? []

    const newTags = uniqueTags.filter((tag) => !existingTags.includes(tag))
    const newFields = uniqueFields.filter((field) => !existingFields.includes(field))

    if (!newTags.length && !newFields.length) {
      return
    }

    await this.updateOneNative(
      { _id: userId },
      {
        $addToSet: {
          ...(newTags.length && { contactTags: { $each: newTags } }),
          ...(newFields.length && { contactFields: { $each: newFields } }),
        },
      },
    )
    this.logger.log(`Added ${newTags.length} tags and ${newFields.length} fields to user ${userId}`)
  }

  async syncIndexes() {
    return this.model.syncIndexes()
  }
}
