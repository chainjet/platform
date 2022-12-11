import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class RequestMigrationPayload {
  @Field()
  result: boolean
}
