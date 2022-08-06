import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Field, ID, ObjectType } from '@nestjs/graphql'
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
}
