import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class GenerateApiTokenPayload {
  @Field()
  apiKey: string
}
