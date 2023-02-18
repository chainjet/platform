import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { UserEvent, UserEventKey } from './entities/user-event'

@Injectable()
export class UserEventService extends BaseService<UserEvent> {
  protected readonly logger = new Logger(UserEventService.name)
  static instance: UserEventService

  constructor(@InjectModel(UserEvent) protected readonly model: ReturnModelType<typeof UserEvent>) {
    super(model)
    UserEventService.instance = this
  }

  async log(userId: ObjectId, key: UserEventKey | string): Promise<{ _id: ObjectId }> {
    const date = new Date().toISOString().split('T')[0]
    const query = {
      user: userId as Types.ObjectId,
      key,
      date,
    }
    const event = await this.model.exists(query)
    if (event) {
      await this.updateOneNative({ _id: event._id }, { $inc: { value: 1 } })
      return event
    } else {
      return await this.createOne({ ...query, value: 1 })
    }
  }
}
