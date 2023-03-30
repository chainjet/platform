import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Field, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { Index, prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { IntegrationAction } from '../../integration-actions/entities/integration-action'
import { Integration } from '../../integrations/entities/integration'

@ObjectType()
@Index({ integration: 1, key: 1 }, { unique: true })
@EntityRef('integration', () => Integration)
@EntityRef('integrationAction', () => IntegrationAction)
export class IntegrationTrigger extends BaseEntity {
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
   * Short plain text description
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
  unlisted: boolean

  // TODO remove index and filterable. Filter by unlisted instead.
  @FilterableField()
  @prop({ default: false, index: true })
  deprecated: boolean

  @FilterableField({ nullable: true })
  @prop({ index: true })
  category?: string

  @FilterableField()
  @prop({ default: false })
  skipAuth?: boolean

  @Field({ defaultValue: false })
  @prop({ default: false })
  pinned?: boolean

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
   * JSON Schema for a successful response of a single item in the trigger
   * In a "New Item" trigger the schema would be a single item
   */
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaResponse?: JSONSchema7

  /**
   * x-triggerPopulate OpenAPI extension
   */
  @jsonProp()
  triggerPopulate?: {
    operationId: string
    inputs: Record<string, string>
  }

  @Field()
  @prop({ default: false })
  instant: boolean

  @Field()
  @prop({ default: false })
  isWebhook: boolean

  @Field({ nullable: true })
  @prop()
  hookInstructions: string

  /**
   * Key that identifies an item ID on the action response.
   * It can have `.` and/or `[]` for locating the key in a JSON response (e.g. result.items[]itemId)
   */
  @prop()
  idKey?: string

  /**
   * Schema response is learn from the first request and stored on the integration trigger
   * Used when the schema doesn't change between different user invocations
   */
  @prop()
  learnResponseIntegration?: boolean

  /**
   * Schema response is learn from the first request and stored on the workflow trigger
   * Used when the schema changes between different user invocations
   */
  @prop()
  learnResponseWorkflow?: boolean

  /**
   * Generic metadata for the integration trigger
   */
  @jsonProp()
  metadata?: Record<string, any>
}
