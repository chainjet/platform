import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Order } from '../entities/order'

@Injectable()
export class OrderService extends BaseService<Order> {
  protected readonly logger = new Logger(OrderService.name)
  static instance: OrderService

  constructor(@InjectModel(Order) protected readonly model: ReturnModelType<typeof Order>) {
    super(model)
    OrderService.instance = this
  }
}
