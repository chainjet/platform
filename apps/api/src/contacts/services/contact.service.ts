import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Contact } from '../entities/contact'

@Injectable()
export class ContactService extends BaseService<Contact> {
  protected readonly logger = new Logger(ContactService.name)

  constructor(@InjectModel(Contact) protected readonly model: ReturnModelType<typeof Contact>) {
    super(model)
  }
}
