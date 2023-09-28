import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'

@Injectable()
export class SubscriptionGroupAuthorizer extends OwnedAuthorizer<SubscriptionGroup> {}

@ObjectType()
@OwnedEntity()
@Authorize<SubscriptionGroup>(SubscriptionGroupAuthorizer)
export class SubscriptionGroup extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @prop({ required: true })
  @Field()
  name: string

  @prop({ required: true })
  @Field()
  defaultGroup: boolean

  @prop({})
  @Field()
  subscribedByDefault: boolean

  @prop({})
  @Field()
  subscriptors: number
}

@InputType()
export class CreateSubscriptionGroupInput {
  @Field()
  name: string

  @Field()
  subscribedDefault: boolean
}

@InputType()
export class UpdateSubscriptionGroupInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  subscribedDefault: boolean
}
