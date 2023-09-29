import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { Index, prop } from '@typegoose/typegoose'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { User } from '../../users/entities/user'

@Injectable()
export class ContactAuthorizer extends OwnedAuthorizer<Contact> {}

@ObjectType()
@OwnedEntity()
@Authorize<Contact>(ContactAuthorizer)
@Index({ owner: 1, address: 1 }, { unique: true })
export class Contact extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @FilterableField(() => GraphQLString)
  @prop({ required: true, validate: isAddress, set: (addr) => addr && getAddress(addr) })
  address: string

  @Field({ nullable: true })
  @prop({
    validate: isAddress,
    set: function (addr) {
      if (!addr) {
        return
      }
      const parsed = getAddress(addr)
      if (parsed && parsed !== this.address) {
        return parsed
      }
    },
  })
  notificationAddress?: string

  @Field(() => [GraphQLString], { nullable: true })
  @prop({ default: [], index: true })
  tags: string[]

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  fields?: Record<string, any>

  @Field()
  @prop({ default: 0 })
  campaigns: number

  @Field()
  @prop({ default: true })
  subscribed: boolean
}

@InputType()
export class CreateContactInput {
  @Field()
  address: string

  @Field(() => [GraphQLString], { nullable: true })
  tags?: string[]

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields?: Record<string, any>

  @Field({ nullable: true })
  subscribed?: boolean
}

@InputType()
export class UpdateContactInput {
  @Field(() => [GraphQLString], { nullable: true })
  tags?: string[]

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields?: Record<string, any>

  @Field({ nullable: true })
  subscribed?: boolean
}
