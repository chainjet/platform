import { Field, ObjectType } from '@nestjs/graphql'

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
