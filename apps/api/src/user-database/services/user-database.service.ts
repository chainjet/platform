import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { UserDatabase } from '../entities/user-database'

@Injectable()
export class UserDatabaseService extends BaseService<UserDatabase> {
  protected readonly logger = new Logger(UserDatabaseService.name)
  static instance: UserDatabaseService

  constructor(@InjectModel(UserDatabase) protected readonly model: ReturnModelType<typeof UserDatabase>) {
    super(model)
    UserDatabaseService.instance = this
  }
}
