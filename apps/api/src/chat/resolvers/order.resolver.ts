import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateOrderInput, Order, UpdateOrderInput } from '../entities/order'
import { OrderService } from '../services/order.service'

@Resolver(() => Order)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Order))
export class OrderResolver extends BaseResolver(Order, {
  CreateDTOClass: CreateOrderInput,
  UpdateDTOClass: UpdateOrderInput,
  guards: [GraphqlGuard],
  enableTotalCount: true,
}) {
  constructor(protected orderService: OrderService, @InjectAuthorizer(Order) readonly authorizer: Authorizer<Order>) {
    super(orderService)
  }
}
