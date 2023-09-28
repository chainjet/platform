import { BaseService } from '@app/common/base/base.service'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeleteOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { SubscriptionGroup } from '../entities/subscription-group'

@Injectable()
export class SubscriptionGroupService extends BaseService<SubscriptionGroup> {
  protected readonly logger = new Logger(SubscriptionGroupService.name)

  constructor(@InjectModel(SubscriptionGroup) protected readonly model: ReturnModelType<typeof SubscriptionGroup>) {
    super(model)
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<SubscriptionGroup> | undefined): Promise<SubscriptionGroup> {
    const subscriptionGroup = await this.model.findById(id)
    if (!subscriptionGroup) {
      throw new NotFoundException('Subscription group not found')
    }
    if (subscriptionGroup.defaultGroup) {
      throw new BadRequestException('Cannot delete default subscription group')
    }
    return super.deleteOne(id, opts)
  }
}
