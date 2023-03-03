import { BaseEntity } from '@app/common/base/base-entity'
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { IsEmail } from 'class-validator'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { UserAuthorizer } from '../resolvers/user.authorizer'

@ObjectType()
@Authorize<User>(UserAuthorizer)
export class User extends BaseEntity {
  @prop({
    required: true,
    unique: true,
    sparse: true, // TODO remove after migration
    validate: isAddress,
    set: (addr) => addr && getAddress(addr),
  })
  address: string

  @Field({ nullable: true })
  @prop({ required: false, trim: true })
  @IsEmail()
  email: string

  @prop({ type: () => [String], default: [] })
  nonces: string[]

  /**
   * whether the user has verified their email
   */
  @prop()
  verified: boolean

  /**
   * the verification token used to verify the user's email
   */
  @prop()
  verificationToken?: string

  @Field(() => Int)
  @prop({ default: 0 })
  operationsUsedMonth: number

  @prop({ default: 0 })
  operationsUsedTotal: number

  /**
   * @deprecated
   */
  @Field({ nullable: true })
  @prop()
  name?: string

  // updates once every 24 hours
  lastActiveAt?: Date

  @Field({ defaultValue: false })
  @prop()
  subscribedToNotifications?: boolean

  @Field({ defaultValue: false })
  @prop()
  subscribedToNewsletter?: boolean

  @prop()
  flagged?: boolean

  @prop()
  limits?: Record<string, number>
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  subscribedToNotifications?: boolean

  @Field({ nullable: true })
  subscribedToNewsletter?: boolean
}
