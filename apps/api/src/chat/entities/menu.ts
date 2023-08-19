import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'
import { CreateMenuItemInput, MenuItem, UpdateMenuItemInput } from './menu-item'

@Injectable()
export class MenuAuthorizer extends OwnedAuthorizer<Menu> {}

@ObjectType()
@OwnedEntity()
@Authorize<Menu>(MenuAuthorizer)
export class Menu extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @Field()
  @prop({ required: true, set: (name) => name.trim() })
  name: string

  @Field({ nullable: true })
  @prop({})
  currency: string

  @Field(() => [MenuItem])
  @prop({ default: [] })
  items: MenuItem[]
}

@InputType()
export class CreateMenuInput {
  @Field()
  name: string

  @Field({ nullable: true })
  currency: string

  @Field(() => [CreateMenuItemInput])
  items: CreateMenuItemInput[]
}

@InputType()
export class UpdateMenuInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  currency: string

  @Field(() => [UpdateMenuItemInput], { nullable: true })
  items: UpdateMenuItemInput[]
}
