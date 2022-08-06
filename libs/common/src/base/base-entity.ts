import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import mongoose from 'mongoose'

@ObjectType({ isAbstract: true })
export abstract class BaseEntity {
  _id: mongoose.Types.ObjectId

  @FilterableField(() => ID)
  get id(): string {
    return (this as any)._id?.toString()
  }

  set id(_: string) {}

  @FilterableField(() => GraphQLISODateTime)
  get createdAt(): Date {
    return this._id.getTimestamp()
  }

  set createdAt(_: Date) {}
}
