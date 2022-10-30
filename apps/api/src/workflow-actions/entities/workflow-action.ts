import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { OperationType } from '@app/definitions/types/OperationType'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { IntegrationAction } from '../../integration-actions/entities/integration-action'
import { User } from '../../users/entities/user'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowNextAction } from './workflow-next-action'

@Injectable()
export class WorkflowActionAuthorizer extends OwnedAuthorizer<WorkflowAction> {}

@ObjectType()
@OwnedEntity()
@Authorize<WorkflowAction>(WorkflowActionAuthorizer)
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

  @prop()
  isContractRootAction?: boolean

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

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  lastItem?: Record<string, any>

  @Field(() => ID, { nullable: true })
  @prop({ ref: AccountCredential })
  credentials?: Reference<AccountCredential>

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaResponse?: JSONSchema7

  // generic store to save data relative to the workflow trigger like ids fetched
  @jsonProp()
  store?: Record<string, any>

  @Field(() => OperationType)
  @prop({ enum: OperationType, type: String })
  type: OperationType

  @Field(() => GraphQLString)
  @prop()
  address?: string
}

@InputType()
export class CreateWorkflowActionInput {
  @Field(() => ID)
  workflow: Reference<Workflow>

  @Field(() => ID)
  integrationAction: Reference<IntegrationAction>

  @Field(() => GraphQLJSONObject)
  inputs: Record<string, any>

  @Field(() => ID, { nullable: true })
  previousAction?: Reference<WorkflowAction>

  @Field({ nullable: true })
  previousActionCondition?: string

  @Field(() => ID, { nullable: true })
  nextAction?: Reference<WorkflowAction>

  @Field(() => ID, { nullable: true })
  credentials?: Reference<AccountCredential>
}

@InputType()
export class UpdateWorkflowActionInput {
  @Field()
  name: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputs?: Record<string, any>

  @Field(() => ID, { nullable: true })
  credentials?: Reference<AccountCredential>

  @Field(() => GraphQLString, { nullable: true })
  address?: string
}
