import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { modelOptions, Severity } from '@typegoose/typegoose'
import mongoose from 'mongoose'

@ObjectType({ isAbstract: true })
@modelOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
  schemaOptions: {
    // https://mongoosejs.com/docs/guide.html#strictQuery
    // strict query removes fields not in the schema from the queries
    // with strictQuery = true, a typo in a query will ignore the field and return all results
    strictQuery: false,
  },
})
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
