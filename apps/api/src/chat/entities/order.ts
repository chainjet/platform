import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { User } from '../../users/entities/user'
import { CreateOrderItemInput, OrderItem, UpdateOrderItemInput } from './order-item'

export enum OrderState {
  PendingPayment = 'pending-payment',
  PendingDelivery = 'pending-delivery',
  Completed = 'completed',
}

@Injectable()
export class OrderAuthorizer extends OwnedAuthorizer<Order> {}

@ObjectType()
@OwnedEntity()
@Authorize<Order>(OrderAuthorizer)
export class Order extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @Field()
  @prop({ required: true, validate: isAddress, set: (addr) => addr && getAddress(addr) })
  address: string

  @Field()
  @prop({ required: true, default: 0 })
  total: number

  @prop({ required: true })
  @Field()
  state: OrderState

  @Field(() => [OrderItem])
  @prop({ default: [] })
  items: OrderItem[]
}

@InputType()
export class CreateOrderInput {
  @Field()
  address: string

  @Field({ nullable: true })
  total: number

  @Field()
  state: OrderState

  @Field(() => [CreateOrderItemInput])
  items: CreateOrderItemInput[]
}

@InputType()
export class UpdateOrderInput {
  @Field({ nullable: true })
  address: string

  @Field({ nullable: true })
  total: number

  @Field({ nullable: true })
  state: OrderState

  @Field(() => [UpdateOrderItemInput], { nullable: true })
  items: UpdateOrderItemInput[]
}
