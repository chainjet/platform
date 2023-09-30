import { Injectable } from '@nestjs/common'
import { CoreContactService } from './core-contact.service'

@Injectable()
export class NotificationService {
  static instance: NotificationService

  constructor(private coreContractService: CoreContactService) {
    NotificationService.instance = this
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
}
