import { BaseService } from '@app/common/base/base.service'
import { RedisPubSubService } from '@app/common/cache/redis-pubsub.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Order } from '../entities/order'

@Injectable()
export class OrderService extends BaseService<Order> {
  protected readonly logger = new Logger(OrderService.name)
  static instance: OrderService

  constructor(
    @InjectModel(Order) protected readonly model: ReturnModelType<typeof Order>,
    private redisPubSubService: RedisPubSubService,
  ) {
    super(model)
    OrderService.instance = this
  }

  async createOne(record: Partial<Order>): Promise<Order> {
    const order = await super.createOne(record)
    this.redisPubSubService.publish(
      'orderCreated',
      JSON.stringify({
        id: order.id,
      }),
    )
    return order
  }
}
