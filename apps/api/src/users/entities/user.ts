import { BaseEntity } from '@app/common/base/base-entity'
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { IsEmail } from 'class-validator'
import { getAddress, isAddress } from 'ethers/lib/utils'

@ObjectType()
export class User extends BaseEntity {
  @prop({
    required: true,
    unique: true,
    sparse: true, // TODO remove after migration
    validate: isAddress,
    set: getAddress,
  })
  address: string

  @FilterableField()
  @prop({ required: false, unique: true, sparse: true, trim: true })
  @IsEmail()
  email: string

  @prop({ type: () => [String], default: [] })
  nonces: string[]

  /**
   * @deprecated
   */
  @prop()
  verified: boolean

  /**
   * @deprecated
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
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string
}
