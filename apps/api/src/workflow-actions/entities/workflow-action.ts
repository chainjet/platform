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
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { IntegrationAction } from '../../integration-actions/entities/integration-action'
import { User } from '../../users/entities/user'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowNextAction } from './workflow-next-action'

@ObjectType()
@OwnedEntity()
@EntityRef('owner', () => User)
@EntityRef('workflow', () => Workflow)
@EntityRef('integrationAction', () => IntegrationAction)
@EntityRef('credentials', () => AccountCredential, { nullable: true })
export class WorkflowAction extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: 'Workflow', required: true, index: true })
  readonly workflow!: Reference<Workflow>

  @FilterableField()
  @prop({ default: false })
  isRootAction: boolean

  @Field(() => ID)
  @prop({ ref: IntegrationAction, required: true })
  readonly integrationAction!: Reference<IntegrationAction>

  @Field()
  @prop({ required: true })
  name: string

  // It should be nullable in order to return an empty object
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp({ required: true })
  inputs: Record<string, any>

  @Field(() => [WorkflowNextAction], { nullable: true })
  @prop({ _id: false, type: WorkflowNextAction, default: [] })
  nextActions: WorkflowNextAction[]

  @Field(() => ID, { nullable: true })
  @prop({ ref: AccountCredential })
  credentials?: Reference<AccountCredential>

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaResponse?: JSONSchema7
}

@InputType()
export class CreateWorkflowActionInput {
  @Field(() => ID)
  workflow: Ref<Workflow>

  @Field(() => ID)
  integrationAction: Ref<IntegrationAction>

  @Field(() => GraphQLJSONObject)
  inputs: Record<string, any>

  @Field(() => ID, { nullable: true })
  previousAction?: Ref<WorkflowAction>

  @Field({ nullable: true })
  previousActionCondition?: string

  @Field(() => ID, { nullable: true })
  nextAction?: Ref<WorkflowAction>

  @Field(() => ID, { nullable: true })
  credentials?: Ref<AccountCredential>
}

@InputType()
export class UpdateWorkflowActionInput {
  @Field()
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputs?: Record<string, any>

  @Field(() => ID, { nullable: true })
  credentials?: Ref<AccountCredential>
}
