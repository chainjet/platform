import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { UserDatabaseItem } from '../entities/user-database-item'

@Injectable()
export class UserDatabaseItemService extends BaseService<UserDatabaseItem> {
  protected readonly logger = new Logger(UserDatabaseItemService.name)
  static instance: UserDatabaseItemService

  constructor(@InjectModel(UserDatabaseItem) protected readonly model: ReturnModelType<typeof UserDatabaseItem>) {
    super(model)
    UserDatabaseItemService.instance = this
  }
}
