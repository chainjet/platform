import { BaseEntity } from '@app/common/base/base-entity'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { IntegrationAuthDefinition, IntegrationAuthType } from '@app/definitions/types/IntegrationAuthDefinition'
import { Field, ObjectType, registerEnumType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'

@ObjectType()
export class IntegrationAccount extends BaseEntity {
  @FilterableField()
  @prop({ required: true, unique: true })
  readonly key: string

  @FilterableField()
  @prop({ required: true })
  name: string

  @Field({ nullable: true })
  @prop()
  description?: string

  @Field(() => IntegrationAuthType)
  @prop({ required: true, enum: IntegrationAuthType, type: String })
  authType: IntegrationAuthType

  // OAuth2 strategies can have extra authorization params that must be set in the strategy
  @jsonProp()
  authParams?: Record<string, any>

  @prop()
  customStrategyKey?: string

  /**
   * Some integrations send required data in the callback querystring. Setting the keys here will store them as credentials.
   */
  @prop()
  queryStringCredentials: string[]

  /**
   * JSON Schema with the authentication fields users can enter.
   * Only exposed fields can be sent back after creation (e.g. account region).
   */
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  fieldsSchema?: IntegrationAuthDefinition['schema']

  /**
   * Security schema from the integration OpenAPI 3 definition
   */
  @jsonProp()
  securitySchema?: IntegrationAuthDefinition['securitySchema']

  /**
   * Key in the security schema used for authentication.
   * Integrations may support multiple auth strategies but a IntegrationAccount refers to a single one
   */
  @prop()
  securitySchemeKey?: string
}

// Create a GraphQL enum for IntegrationAuthType
registerEnumType(IntegrationAuthType, {
  name: 'IntegrationAuthType',
  description: 'Authentication strategy',
})
