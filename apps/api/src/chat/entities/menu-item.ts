import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'

@ObjectType()
export class MenuItem {
  @Field()
  @prop({ required: true, set: (name) => name.trim() })
  name: string

  @Field()
  @prop({ required: true, default: 0 })
  price: number
}

@InputType()
export class CreateMenuItemInput {
  @Field()
  name: string

  @Field({ nullable: true })
  price: number
}

@InputType()
export class UpdateMenuItemInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  price: number
}
