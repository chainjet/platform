import { BaseService } from '@app/common/base/base.service'
import { Reference } from '@app/common/typings/mongodb'
import {
  getWalletEns,
  getWalletFarcasterProfile,
  getWalletLensProfile,
  getWalletName,
} from '@app/definitions/utils/address.utils'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { getAddress } from 'ethers/lib/utils'
import { uniq } from 'lodash'
import { ObjectId, WriteError } from 'mongodb'
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

  async addSingleContact(address: string, user: User, tags?: string[]): Promise<Contact> {
    const total = await this.countNative({ owner: user._id })
    if (total + 1 > user.planConfig.maxContacts) {
      throw new BadRequestException(
        `Your current plan only allows you to have ${user.planConfig.maxContacts} contacts. Please upgrade to add more.`,
      )
    }
    const contact = await this.findOne({ owner: user._id, address })
    if (contact) {
      if (tags?.length) {
        const newTags = uniq([...contact.tags, ...tags])
        if (newTags.length !== contact.tags.length) {
          await this.updateById(contact._id, {
            tags: newTags,
          })
          this.logger.log(`Updated contact ${address} for ${user.id}`)
        }
      }
      return contact
    }
    const newContact = await this.createOne({
      owner: user._id as Reference<User>,
      address,
      tags,
    })
    this.logger.log(`Added contact ${address} for ${user.id}`)
    return newContact
  }

  async addContacts(addresses: string[], user: User, tags?: string[]) {
    const total = await this.countNative({ owner: user._id })
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
      await this.insertMany(contacts, { ordered: false })
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
      const res = await this.updateManyNative(
        { address: { $in: duplicatedAddresses }, owner: user._id },
        { $addToSet: { tags: { $each: tags } } },
      )
      updatedContacts = res.modifiedCount
    }

    this.logger.log(
      `Added ${addresses.length - duplicatedAddresses.length} contacts and updated ${updatedContacts} for ${user.id}`,
    )
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
