import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { OperationType } from '@app/definitions/types/OperationType'
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { Integration } from '../../integrations/entities/integration'

@ObjectType()
@EntityRef('integration', () => Integration)
export class IntegrationAction extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: 'Integration', required: true, index: true })
  readonly integration: Reference<Integration>

  @FilterableField()
  @prop({ required: true })
  readonly key: string

  @FilterableField()
  @prop({ required: true, text: true })
  name: string

  /**
   * Short plain text summary
   */
  @Field({ nullable: true })
  @prop()
  description?: string

  /**
   * Full markdown description
   */
  @prop()
  fullDescription?: string

  @FilterableField()
  @prop({ default: false, index: true })
  deprecated: boolean

  @FilterableField({ nullable: true })
  @prop({ index: true })
  category?: string

  @FilterableField(() => OperationType)
  @prop({ default: OperationType.OffChain, enum: OperationType, type: String })
  type?: OperationType = OperationType.OffChain

  @FilterableField()
  @prop({ default: false })
  skipAuth?: boolean

  /**
   * Operation ID on the OpenAPI 3 schema
   */
  @prop()
  schemaId?: string

  /**
   * Operation path on the OpenAPI 3 schema
   */
  @prop()
  schemaPath?: string

  /**
   * Operation method on the OpenAPI 3 schema
   */
  @prop()
  schemaMethod?: string

  /**
   * JSON Schema with the properties for the request
   */
  @Field(() => GraphQLJSONObject)
  @jsonProp({ required: true })
  schemaRequest: JSONSchema7

  /**
   * JSON Schema for a successful response
   */
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaResponse?: JSONSchema7

  /**
   * Schema response is learn from the first request and stored on the integration action
   * Used when the schema doesn't change between different user invocations
   */
  @prop()
  learnResponseIntegration?: boolean

  /**
   * Schema response is learn from the first request and stored on the workflow action
   * Used when the schema changes between different user invocations
   */
  @prop()
  learnResponseWorkflow?: boolean

  /**
   * Generic metadata for the integration action
   */
  @jsonProp()
  metadata?: Record<string, any>
}

// Create a GraphQL enum for OperationType
registerEnumType(OperationType, {
  name: 'OperationType',
  description: 'Operation type',
})
