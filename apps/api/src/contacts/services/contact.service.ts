import { BaseService } from '@app/common/base/base.service'
import { Reference } from '@app/common/typings/mongodb'
import {
  getWalletEns,
  getWalletFarcasterProfile,
  getWalletLensProfile,
  getWalletName,
} from '@app/definitions/utils/address.utils'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { uniq } from 'lodash'
import { ObjectId } from 'mongodb'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { Contact } from '../entities/contact'

@Injectable()
export class ContactService extends BaseService<Contact> {
  protected readonly logger = new Logger(ContactService.name)
  static instance: ContactService

  constructor(@InjectModel(Contact) protected readonly model: ReturnModelType<typeof Contact>) {
    super(model)
    ContactService.instance = this
  }

  async resolveContactData(address: string, key: string, contactOwner: User) {
    switch (key) {
      case 'walletName':
        return getWalletName(address)
      case 'ens':
        return getWalletEns(address)
      case 'lens':
        return getWalletLensProfile(address)
      case 'farcaster':
        return getWalletFarcasterProfile(address)
      case 'tags':
        const contact = await this.findOne({ address, owner: contactOwner })
        return contact?.tags ?? []
    }
  }

  async addTags(address: string, tags: string[], ownerId: ObjectId): Promise<string[]> {
    const contact = await this.findOne({
      owner: ownerId,
      address,
    })
    if (!contact) {
      await this.createOne({
        owner: ownerId as Reference<User>,
        address,
        tags,
      })
      return tags
    }
    if (tags.length) {
      const newTags = uniq([...contact.tags, ...tags])
      if (newTags.length !== contact.tags.length) {
        await this.updateById(contact._id, {
          tags: newTags,
        })
        return newTags
      }
    }
    return contact.tags
  }

  async removeTags(address: string, tags: string[], ownerId: ObjectId): Promise<string[]> {
    const contact = await this.findOne({
      owner: ownerId,
      address,
    })
    if (!contact) {
      return []
    }
    if (tags.length) {
      const newTags = contact.tags.filter((tag) => !tags.includes(tag))
      if (newTags.length !== contact.tags.length) {
        await this.updateById(contact._id, {
          tags: newTags,
        })
        return newTags
      }
    }
    return contact.tags
  }
}
