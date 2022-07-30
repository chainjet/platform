import { BaseEntity } from '@app/common/base/base-entity'
import { EntityConnection, EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { Index, mongoose, prop, Ref } from '@typegoose/typegoose'
import { IntegrationAccount } from '../../integration-accounts/entities/integration-account'
import { IntegrationAction } from '../../integration-actions/entities/integration-action'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { OperationCategory } from './operation-category'

@ObjectType()
@Index({ key: 1, version: 1 }, { unique: true })
@EntityRef('integrationAccount', () => IntegrationAccount, { nullable: true })
@EntityConnection('triggers', () => IntegrationTrigger, { relationName: '.integration', maxResultsSize: 360 })
@EntityConnection('actions', () => IntegrationAction, { relationName: '.integration', maxResultsSize: 360 })
export class Integration extends BaseEntity {
  @FilterableField()
  @prop({ required: true })
  readonly key: string

  @FilterableField()
  @prop({ required: true, text: true })
  name: string

  @prop()
  description?: string

  @Field({ nullable: true })
  @prop()
  logo?: string

  @FilterableField()
  @prop({ required: true })
  readonly version: string

  @FilterableField()
  @prop({ required: true, index: true })
  deprecated: boolean

  /**
   * Parent integration key (e.g. aws)
   * @todo replace with definition key
   */
  @FilterableField({ nullable: true })
  @prop()
  parentKey?: string

  @Field(() => ID, { nullable: true })
  @prop({ ref: IntegrationAccount })
  integrationAccount?: Ref<IntegrationAccount>

  @FilterableField(() => String)
  @prop({ type: () => mongoose.Schema.Types.String, dim: 1, index: true, default: [] })
  integrationCategories: string[]

  @Field(() => [OperationCategory], { nullable: true })
  @prop({ _id: false, type: OperationCategory, default: [] })
  operationCategories?: OperationCategory[]

  @FilterableField(() => Int)
  @prop({ default: 0 })
  numberOfTriggers: number

  @FilterableField(() => Int)
  @prop({ default: 0 })
  numberOfActions: number
}
