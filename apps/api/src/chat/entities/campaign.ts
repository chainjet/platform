import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { User } from '../../users/entities/user'

export enum CampaignState {
  Scheduled = 'scheduled',
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

@Injectable()
export class CampaignAuthorizer extends OwnedAuthorizer<Campaign> {}

@ObjectType()
@OwnedEntity()
@Authorize<Campaign>(CampaignAuthorizer)
@EntityRef('credentials', () => AccountCredential, { nullable: true })
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

  @Field(() => AccountCredential, { nullable: true })
  @prop({ ref: AccountCredential })
  credentials?: Reference<AccountCredential>

  @prop({ index: true })
  @Field({ nullable: true })
  scheduleDate?: Date

  @prop()
  @Field(() => [String], { nullable: true })
  includeTags: string[]

  // TODO
  // @prop()
  // @Field(() => [String], { nullable: true })
  // excludeTags: string[]

  @prop({ default: CampaignState.Pending })
  @Field()
  state: CampaignState

  @prop()
  @Field({ nullable: true })
  error?: string
}

@InputType()
export class CreateCampaignInput {
  @Field()
  name: string

  @Field()
  message: string

  @Field(() => ID, { nullable: true })
  credentials?: Reference<AccountCredential>

  @Field({ nullable: true })
  scheduleDate: Date

  @Field(() => [String], { nullable: true })
  includeTags: string[]

  @Field(() => [String], { nullable: true })
  excludeTags: string[]
}

@InputType()
export class UpdateCampaignInput {
  @Field({ nullable: true })
  name: string

  @Field({ nullable: true })
  scheduleDate: Date
}
