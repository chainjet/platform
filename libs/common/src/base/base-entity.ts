import { FilterableField } from '@nestjs-query/query-graphql'
import { GraphQLISODateTime, ID, ObjectType } from '@nestjs/graphql'
import { ObjectId } from 'mongodb'

@ObjectType({ isAbstract: true })
export abstract class BaseEntity {
  _id: ObjectId

  @FilterableField(() => ID)
  get id (): string {
    return (this as any)._id?.toString()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  set id (_: string) {}

  @FilterableField(() => GraphQLISODateTime)
  get createdAt (): Date {
    return this._id.getTimestamp()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  set createdAt (_: Date) {}
}
