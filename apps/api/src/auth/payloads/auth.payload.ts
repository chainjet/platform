import { Field, ObjectType } from '@nestjs/graphql'
import { User } from '../../users/entities/user'

@ObjectType()
export class AuthToken {
  @Field()
  accessToken: string

  @Field()
  accessTokenExpiration: Date

  @Field()
  refreshToken: string
}

@ObjectType()
export class LoginPayload {
  @Field()
  user: User

  @Field()
  token: AuthToken
}

@ObjectType()
export class RegisterPayload {
  @Field()
  user: User

  @Field()
  token: AuthToken
}

@ObjectType()
export class VerifyEmailPayload {
  @Field({ nullable: true })
  error?: string
}

@ObjectType()
export class ResetPasswordPayload {
  @Field()
  result: true
}

@ObjectType()
export class CompletePasswordPayload {
  @Field({ nullable: true })
  error?: string
}

@ObjectType()
export class CompleteExternalAuthPayload {
  @Field()
  user: User

  @Field()
  token: AuthToken
}
