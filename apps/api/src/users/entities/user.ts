import { BaseEntity } from '@app/common/base/base-entity'
import { addOneMonth } from '@app/common/utils/date.utils'
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { IsEmail } from 'class-validator'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { Schema } from 'mongoose'
import { defaultPlan, PlanConfig, plansConfig } from '../config/plans.config'
import { UserAuthorizer } from '../resolvers/user.authorizer'

@ObjectType()
@Authorize<User>(UserAuthorizer)
export class User extends BaseEntity {
  @prop({
    required: true,
    unique: true,
    validate: isAddress,
    set: (addr) => addr && getAddress(addr),
  })
  address: string

  /**
   * @deprecated
   */
  @Field({ nullable: true })
  @prop({ required: false, trim: true })
  @IsEmail()
  email: string

  @prop({ type: () => [String], default: [] })
  nonces: string[]

  @Field(() => GraphQLJSONObject, { nullable: true })
  @prop({ type: Schema.Types.Mixed })
  externalApps?: Record<string, number>

  /**
   * whether the user has verified their email
   * @deprecated
   */
  @prop()
  verified: boolean

  /**
   * the verification token used to verify the user's email
   * @deprecated
   */
  @prop()
  verificationToken?: string

  /**
   * Operations used during the current period. Resets on operationsReset date.
   */
  @Field(() => Int)
  @prop({ default: 0 })
  operationsUsedMonth: number

  @prop({ default: 0 })
  operationsUsedTotal: number

  @Field()
  @prop({ default: () => addOneMonth() })
  operationsReset: Date

  @Field({})
  @prop({ required: true, default: defaultPlan })
  plan: string

  /**
   * When the user is downgrading, this is the plan they are downgrading to.
   */
  @Field({ nullable: true })
  @prop()
  nextPlan?: string

  @Field({ nullable: true })
  @prop()
  planPeriodEnd?: Date

  @prop()
  stripeCustomerId?: string

  @prop()
  stripeSubscriptionId?: string

  /**
   * @deprecated
   */
  @Field({ nullable: true })
  @prop()
  name?: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  @prop({ type: Schema.Types.Mixed })
  features?: Record<string, boolean>

  @prop()
  flagged?: boolean

  @prop()
  limits?: Record<string, number>

  @Field(() => [GraphQLString], { nullable: true })
  @prop()
  contactTags?: string[]

  @Field(() => [GraphQLString], { nullable: true })
  @prop()
  contactFields?: string[]

  get planConfig(): PlanConfig {
    return plansConfig[this.plan]
  }
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  features?: Record<string, boolean>
}
