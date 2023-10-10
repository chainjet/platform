import { BaseService } from '@app/common/base/base.service'
import { ContactsExceededError } from '@app/common/errors/contacts-exceeded.error'
import { Reference } from '@app/common/typings/mongodb'
import {
  getWalletEns,
  getWalletFarcasterProfile,
  getWalletLensProfile,
  getWalletName,
} from '@app/definitions/utils/address.utils'
import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { getAddress } from 'ethers/lib/utils'
import { uniq } from 'lodash'
import { ObjectId, WriteError } from 'mongodb'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { NotificationMessages } from '../../users/notification-messages'
import { UserNotificationService } from '../../users/services/user-notifications.service'
import { UserService } from '../../users/services/user.service'
import { Contact } from '../entities/contact'

@Injectable()
export class ContactService extends BaseService<Contact> {
  protected readonly logger = new Logger(ContactService.name)
  static instance: ContactService

  constructor(
    @InjectModel(Contact) protected readonly model: ReturnModelType<typeof Contact>,
    @InjectQueue('contacts') private contactsQueue: Queue,
    private userService: UserService,
    private notificationService: UserNotificationService,
  ) {
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

  async addSingleContact(address: string, user: User, tags?: string[], subscribed: boolean = true): Promise<Contact> {
    const total = await this.countNative({ owner: user._id })
    if (total + 1 > user.planConfig.maxContacts && user.planConfig.hardLimits) {
      await this.notificationService.sendNotification(user.address, NotificationMessages.contactsExceeded(user))
      throw new ContactsExceededError(
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
      subscribed,
    })
    this.logger.log(`Added contact ${address} for ${user.id}`)
    return newContact
  }

  async addContacts(addresses: string[], user: User, tags?: string[]) {
    const total = await this.countNative({ owner: user._id })
    if (total + addresses.length > user.planConfig.maxContacts && user.planConfig.hardLimits) {
      await this.notificationService.sendNotification(user.address, NotificationMessages.contactsExceeded(user))
      throw new ContactsExceededError(
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
        const existingTags = contact.tags.map((tag) => tag.toLowerCase())
        const tagsAdded = tags.filter((tag) => !existingTags.includes(tag.toLowerCase()))
        await this.onTagsAdded(contact, tagsAdded)
        await this.userService.addContactDataKeys(contact.owner._id, [contact])
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

  async afterCreateOne(contact: Contact) {
    this.contactsQueue.add({
      type: 'contactAdded',
      contactId: contact._id,
      contactAddress: contact.address,
      ownerId: contact.owner,
    })
    if (contact.tags?.length) {
      await this.onTagsAdded(contact, contact.tags)
    }
    await this.userService.addContactDataKeys(contact.owner._id, [contact])
  }

  async afterCreateMany(contacts: Contact[]) {
    this.contactsQueue.add({
      type: 'contactsAdded',
      contactIds: contacts.map((contact) => contact._id),
      contactAddresses: contacts.map((contact) => contact.address),
      ownerId: contacts[0].owner,
    })
    const contactsWithTags = contacts.filter((contact) => contact.tags && contact.tags.length)
    if (contactsWithTags.length) {
      this.contactsQueue.add({
        type: 'contactsTagged',
        contactIds: contactsWithTags.map((contact) => contact._id),
        contactAddresses: contactsWithTags.map((contact) => contact.address),
        ownerId: contacts[0].owner,
        tags: contactsWithTags.flatMap((contact) => contact.tags),
      })
    }
    await this.userService.addContactDataKeys(contacts[0].owner._id, contacts)
  }

  async updateOne(
    id: string,
    update: Partial<Contact>,
    opts?: UpdateOneOptions<Contact> | undefined,
  ): Promise<Contact> {
    if (!update.tags && !update.fields) {
      return super.updateOne(id, update, opts)
    }

    // if new tags were added, trigger contactTagged job
    const contactBefore = await this.findOne({ _id: id })
    if (!contactBefore) {
      throw new NotFoundException(`Contact with id ${id} not found`)
    }
    const contact = await super.updateOne(id, update, opts)

    if (update.tags) {
      const existingTags = contactBefore.tags.map((tag) => tag.toLowerCase())
      const tagsAdded = update.tags.filter((tag) => !existingTags.includes(tag.toLowerCase()))
      if (tagsAdded?.length) {
        await this.onTagsAdded(contact, tagsAdded)
      }
    }

    await this.userService.addContactDataKeys(contact.owner._id, [contact])

    return contact
  }

  async onTagsAdded(contact: Contact, tagsAdded: string[]) {
    if (tagsAdded.length) {
      this.contactsQueue.add({
        type: 'contactTagged',
        contactId: contact._id,
        contactAddress: contact.address,
        ownerId: contact.owner,
        tags: tagsAdded,
      })
    }
  }
}
