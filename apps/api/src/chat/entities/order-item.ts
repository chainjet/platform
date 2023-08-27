import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'

@ObjectType()
export class OrderItem {
  @Field()
  @prop({ required: true, set: (name) => name.trim() })
  name: string

  @Field()
  @prop({ required: true })
  quantity: number
}

@InputType()
export class CreateOrderItemInput {
  @Field()
  name: string

  @Field()
  quantity: number
}

@InputType()
export class UpdateOrderItemInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  quantity: number
}
