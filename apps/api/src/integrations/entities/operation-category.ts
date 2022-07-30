import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, Int, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'

@ObjectType()
export class OperationCategory {
  @FilterableField()
  @prop({ required: true })
  key: string

  @FilterableField()
  @prop({ required: true })
  name: string

  @Field({ nullable: true })
  @prop()
  description?: string

  @Field(() => Int)
  @prop({ default: 0 })
  numberOfActions: number

  @Field(() => Int)
  @prop({ default: 0 })
  numberOfTriggers: number
}
