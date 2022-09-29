import { BaseService } from '@app/common/base/base.service'
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
import { User } from '../entities/user'

@Injectable()
export class UserService extends BaseService<User> {
  protected readonly logger = new Logger(UserService.name)

  constructor(
    @InjectModel(User) protected readonly model: ReturnModelType<typeof User>,
    private readonly emailService: EmailService,
  ) {
    super(model)
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
      const template = new EmailVerificationTemplate(user.address, plainVerificationToken)
      await this.emailService.sendEmailTemplate(template, record.email)
    }

    return await super.updateOne(id, record, opts)
  }

  async createAccountFromSignature(message: SiweMessage) {
    const user = await this.findOne({ address: getAddress(message.address) })
    if (user) {
      if (user.nonces?.length > 10) {
        user.nonces = user.nonces.slice(-10)
      }
      user.nonces.push(message.nonce)
      await this.updateById(user._id, user)
    } else {
      await this.createOne({
        address: getAddress(message.address),
        nonces: [message.nonce],
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

  async syncIndexes() {
    return this.model.syncIndexes()
  }
}
