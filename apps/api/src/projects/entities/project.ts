import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'

@ObjectType()
@OwnedEntity()
@EntityRef('owner', () => User)
export class Project extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @FilterableField()
  @prop({ required: true })
  name: string

  @Field()
  @prop({ required: true })
  public: boolean

  @FilterableField()
  @prop({ required: true, unique: true })
  slug: string
}

@InputType()
export class CreateProjectInput {
  @Field()
  name: string

  @Field({ defaultValue: false })
  public: boolean
}

@InputType()
export class UpdateProjectInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  public: boolean
}
