import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLString } from 'graphql'
import { User } from '../../users/entities/user'

@Injectable()
export class ContactAuthorizer extends OwnedAuthorizer<Contact> {}

@ObjectType()
@OwnedEntity()
@Authorize<Contact>(ContactAuthorizer)
export class Contact extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @Field(() => GraphQLString)
  @prop({ required: true })
  address: string

  @Field(() => [GraphQLString], { nullable: true })
  @prop({ default: [] })
  tags: string[]
}
