import { Injectable } from '@nestjs/common'
import { ObjectId } from 'mongodb'
import { FilterQuery } from 'mongoose'
import { Contact } from '../../chat/entities/contact'
import { ContactService } from '../../chat/services/contact.service'
import { User } from '../entities/user'

export interface CoreContract {
  notificationAddress?: string
  subscribedNewsletter?: boolean
  subscribedNotifications?: boolean
}

@Injectable()
export class CoreContactService {
  async findOne(query: FilterQuery<new () => Contact>): Promise<CoreContract | null> {
    const contact = await ContactService.instance.findOne({
      owner: new ObjectId(process.env.CHAINJET_ID),
      ...query,
    })
    if (!contact) {
      return null
    }
    return {
      notificationAddress: contact.notificationAddress,
      subscribedNewsletter: contact.subscribed,
      subscribedNotifications: contact.fields?.['notifications'] !== 'off',
    }
  }

  async createOne(address: string, data: Partial<CoreContract> = {}) {
    return await ContactService.instance.createOne({
      owner: new ObjectId(process.env.CHAINJET_ID) as any as User,
      address,
      notificationAddress: data.notificationAddress,
      subscribed: data.subscribedNewsletter,
      ...(data.subscribedNotifications === false && {
        fields: {
          notifications: 'off',
        },
      }),
    })
  }

  async updateOne(address: string, update: Partial<CoreContract>) {
    const contact = await ContactService.instance.findOne({
      owner: new ObjectId(process.env.CHAINJET_ID),
      address,
    })
    if (!contact) {
      await this.createOne(address, update)
      return
    }
    await ContactService.instance.updateOne(contact.id, {
      ...(update.notificationAddress && { notificationAddress: update.notificationAddress }),
      ...(update.subscribedNewsletter !== undefined && { subscribed: update.subscribedNewsletter }),
      ...(update.subscribedNotifications !== undefined && {
        fields: {
          notifications: update.subscribedNotifications ? 'on' : 'off',
        },
      }),
    })
  }
}
