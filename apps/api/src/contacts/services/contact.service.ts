import { BaseService } from '@app/common/base/base.service'
import {
  getWalletEns,
  getWalletFarcasterProfile,
  getWalletLensProfile,
  getWalletName,
} from '@app/definitions/utils/address.utils'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { Contact } from '../entities/contact'

@Injectable()
export class ContactService extends BaseService<Contact> {
  protected readonly logger = new Logger(ContactService.name)

  constructor(@InjectModel(Contact) protected readonly model: ReturnModelType<typeof Contact>) {
    super(model)
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
    }
  }
}
