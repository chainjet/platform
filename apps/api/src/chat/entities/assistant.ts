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
export class AssistantAuthorizer extends OwnedAuthorizer<Assistant> {}

@ObjectType()
@OwnedEntity()
@Authorize<Assistant>(AssistantAuthorizer)
export class Assistant extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @Field()
  @prop({ required: true })
  name: string

  @Field()
  @prop({ required: true })
  instructions: string

  @Field(() => [String], { nullable: true })
  @prop({ type: () => [String] })
  tags?: string[]

  @Field({ nullable: true })
  @prop()
  enabled?: boolean

  @prop()
  assistantId: string
}

@InputType()
export class CreateAssistantInput {
  @Field()
  name: string

  @Field()
  instructions: string

  @Field(() => [String], { nullable: true })
  tags?: string[]

  @Field({ nullable: true })
  enabled?: boolean
}

@InputType()
export class UpdateAssistantInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  instructions: string

  @Field(() => [String], { nullable: true })
  tags?: string[]

  @Field({ nullable: true })
  enabled?: boolean
}
