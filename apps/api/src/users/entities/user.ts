import { BaseEntity } from '@app/common/base/base-entity'
import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, InputType, Int, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'
import { IsEmail } from 'class-validator'

@ObjectType()
export class User extends BaseEntity {
  @FilterableField()
  @prop({ required: true, unique: true, match: /^[a-zA-Z0-9_.]*$/, trim: true })
  username: string

  @FilterableField()
  @prop({ required: true, unique: true, trim: true })
  @IsEmail()
  email: string

  @prop()
  password?: string

  @prop()
  refreshTokenHash?: string

  @prop()
  resetPasswordToken?: string

  @prop({ default: false })
  verified: boolean

  @prop()
  verificationToken?: string

  @Field(() => Int)
  @prop({ default: 0 })
  operationsUsedMonth: number

  @prop({ default: 0 })
  operationsUsedTotal: number

  // Public profile info
  @Field({ nullable: true })
  @prop()
  name?: string

  @Field({ nullable: true })
  @prop()
  website?: string

  @Field({ nullable: true })
  @prop()
  company?: string

  @Field({ nullable: true })
  @prop({
    get: function (val) {
      return val ? `${this.username}:${val}` : val
    },
    set: (val) => val,
  })
  apiKey?: string
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  website?: string

  @Field({ nullable: true })
  company?: string

  @Field({ nullable: true })
  email?: string
}
