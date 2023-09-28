import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { SubscriptionGroup } from '../entities/subscription-group'

@Injectable()
export class SubscriptionGroupService extends BaseService<SubscriptionGroup> {
  protected readonly logger = new Logger(SubscriptionGroupService.name)

  constructor(@InjectModel(SubscriptionGroup) protected readonly model: ReturnModelType<typeof SubscriptionGroup>) {
    super(model)
  }
}
