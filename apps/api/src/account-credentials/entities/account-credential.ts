import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { prop, Ref } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { IntegrationAccount } from '../../integration-accounts/entities/integration-account'
import { User } from '../../users/entities/user'

@ObjectType()
@OwnedEntity()
@EntityRef('owner', () => User)
@EntityRef('integrationAccount', () => IntegrationAccount)
export class AccountCredential extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: IntegrationAccount, required: true, index: true })
  readonly integrationAccount!: Reference<IntegrationAccount>

  @Field()
  @prop({ required: true })
  name: string

  // Placeholder for credential pairs input
  credentials: Record<string, string>

  @prop()
  encryptedCredentials: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  fields: Record<string, string>

  /**
   * Stores references for operations with dynamic schemas.
   */
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaRefs?: Record<string, JSONSchema7>
}

@InputType()
export class CreateAccountCredentialInput {
  @Field(() => ID)
  integrationAccount: Reference<IntegrationAccount>

  @Field()
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  credentials: Record<string, string>

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields: Record<string, string>
}

@InputType()
export class UpdateAccountCredentialInput {
  @Field({ nullable: true })
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  credentials: Record<string, string>

  @Field(() => GraphQLJSONObject, { nullable: true })
  fields: Record<string, string>
}
