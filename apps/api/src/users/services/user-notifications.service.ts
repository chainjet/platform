import { BaseService } from '@app/common/base/base.service'
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { Cache } from 'cache-manager'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../entities/user'
import { UserNotification } from '../entities/user-notification'
import { CoreContactService } from './core-contact.service'

@Injectable()
export class UserNotificationService extends BaseService<UserNotification> {
  protected readonly logger = new Logger(UserNotificationService.name)
  static instance: UserNotificationService

  constructor(
    @InjectModel(UserNotification) protected readonly model: ReturnModelType<typeof UserNotification>,
    private coreContractService: CoreContactService,
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
  ) {
    super(model)
    UserNotificationService.instance = this
  }

  async sendNotification(address: string, message: string) {
    let contact = await this.coreContractService.findOne({ address })
    if (!contact) {
      contact = await this.coreContractService.createOne(address)
    }
    if (!contact.subscribedNotifications) {
      return
    }
    const notificationAddress = contact?.notificationAddress || address

    // Prevent sending multiple notifications in a short period of time
    if (await this.cacheManager.get(`user-notification-${notificationAddress}`)) {
      return
    }
    await this.cacheManager.set(`user-notification-${notificationAddress}`, true, { ttl: 60 } as any)

    await fetch(process.env.NOTIFICATIONS_WORKFLOW_HOOK!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: notificationAddress,
        message,
      }),
    })
  }

  async sendCreditsWarningNotification(user: User) {
    const year = user.operationsReset.getFullYear()
    const month = String(user.operationsReset.getMonth() + 1).padStart(2, '0')
    const day = String(user.operationsReset.getDate()).padStart(2, '0')
    const operationsResetKey = `${year}-${month}-${day}`
    try {
      await this.createOne({ user: user._id, key: `credits-warning-${operationsResetKey}` })
    } catch (e) {
      return
    }
    await this.sendNotification(
      user.address,
      `You have reached 75% of your monthly credits on ChainJet.` +
        (user.planConfig.hardLimits
          ? ' Once you reach your quota, your chatbots and automations will stop working until your credits reset.\n\n'
          : '\n\n') +
        `Please consider upgrading your plan to avoid any interruptions. You can see our plan options here: https://chainjet.io/pricing\n\n` +
        `If you have any questions, please reply this message, we're happy to help.\n\n` +
        `Best,\n` +
        `The ChainJet Team`,
    )
  }

  async sendCreditsReachedNotification(user: User) {
    if (!user.planConfig.hardLimits) {
      return
    }
    const year = user.operationsReset.getFullYear()
    const month = String(user.operationsReset.getMonth() + 1).padStart(2, '0')
    const day = String(user.operationsReset.getDate()).padStart(2, '0')
    const operationsResetKey = `${year}-${month}-${day}`
    try {
      await this.createOne({ user: user._id, key: `credits-warning-${operationsResetKey}` })
    } catch (e) {
      return
    }
    await this.sendNotification(
      user.address,
      `You have used all of your monthly credits on ChainJet. ` +
        `Your chatbots and automations will now stop working until your credits reset.\n\n` +
        `To continue using ChainJet, please consider upgrading here: https://chainjet.io/pricing\n\n` +
        `If you have any questions, please reply this message, we're happy to help.\n\n` +
        `Best,\n` +
        `The ChainJet Team`,
    )
  }
}
