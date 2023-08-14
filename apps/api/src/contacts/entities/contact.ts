import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { Index, prop } from '@typegoose/typegoose'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
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

  @Field(() => GraphQLString)
  @prop({ required: true, validate: isAddress, set: (addr) => addr && getAddress(addr) })
  address: string

  @Field(() => [GraphQLString], { nullable: true })
  @prop({ default: [] })
  tags: string[]

  @jsonProp()
  fields?: Record<string, any>
}
