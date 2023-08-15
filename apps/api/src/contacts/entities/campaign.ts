import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'

export enum CampaignState {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
}

@Injectable()
export class CampaignAuthorizer extends OwnedAuthorizer<Campaign> {}

@ObjectType()
@OwnedEntity()
@Authorize<Campaign>(CampaignAuthorizer)
export class Campaign extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @prop({ required: true })
  @Field()
  name: string

  @prop({ required: true })
  @Field()
  message: string

  @prop({ default: 0 })
  @Field()
  delivered: number

  @prop({ default: 0 })
  @Field()
  processed: number

  @prop()
  @Field({ nullable: true })
  total: number

  @prop()
  @Field(() => [String], { nullable: true })
  includeTags: string[]

  @prop({ default: CampaignState.Pending })
  @Field()
  state: CampaignState

  // TODO
  // @prop()
  // @Field(() => [String], { nullable: true })
  // excludeTags: string[]
}

@InputType()
export class CreateCampaignInput {
  @Field()
  accountCredentialId: string

  @Field()
  name: string

  @Field()
  message: string

  @Field(() => [String], { nullable: true })
  includeTags: string[]

  @Field(() => [String], { nullable: true })
  excludeTags: string[]
}

@InputType()
export class UpdateCampaignInput {
  @Field({ nullable: true })
  name: string
}
