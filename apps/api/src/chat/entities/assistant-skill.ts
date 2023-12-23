import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { User } from '../../users/entities/user'
import { Assistant } from './assistant'

@Injectable()
export class AssistantSkillAuthorizer extends OwnedAuthorizer<AssistantSkill> {}

@ObjectType()
@OwnedEntity()
@Authorize<AssistantSkill>(AssistantSkillAuthorizer)
export class AssistantSkill extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: 'Assistant', required: true })
  readonly assistant!: Reference<Assistant>

  @Field()
  @prop({ required: true })
  name: string

  @Field(() => GraphQLJSONObject)
  inputs: object
}

@InputType()
export class CreateAssistantSkillInput {
  @Field(() => ID)
  assistant: Reference<Assistant>

  @Field()
  name: string

  @Field(() => GraphQLJSONObject)
  inputs: object
}

@InputType()
export class UpdateAssistantSkillInput {
  @Field({ nullable: true })
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputs?: object
}
