import { Field, ObjectType } from '@nestjs/graphql'

// TODO move to common payloads
@ObjectType()
export class ResultPayload {
  @Field()
  success: boolean
}

@ObjectType()
export class UserCheckoutSessionPayload {
  @Field()
  sessionId: string
}

@ObjectType()
export class GenerateApiTokenPayload {
  @Field()
  apiKey: string
}

@ObjectType()
export class VerifyEmailPayload {
  @Field({ nullable: true })
  error?: string
}
