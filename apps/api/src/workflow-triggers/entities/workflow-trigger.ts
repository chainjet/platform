import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizerWithCustomPrivacy } from '@app/common/base/owned.authorizer'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, Int, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { Schema } from 'mongoose'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { User } from '../../users/entities/user'
import { Workflow } from '../../workflows/entities/workflow'
import { TriggerSchedule } from './trigger-schedule'

@Injectable()
export class WorkflowTriggerAuthorizer extends OwnedAuthorizerWithCustomPrivacy<WorkflowTrigger> {
  sharableRelations = ['integration', 'integrationAction', 'integrationTrigger', 'trigger', 'actions']
}

@ObjectType()
@OwnedEntity()
@Authorize<WorkflowTrigger>(WorkflowTriggerAuthorizer)
@EntityRef('workflow', () => Workflow)
@EntityRef('integrationTrigger', () => IntegrationTrigger)
@EntityRef('credentials', () => AccountCredential, { nullable: true })
export class WorkflowTrigger extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner!: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: 'Workflow', required: true, unique: true })
  readonly workflow!: Reference<Workflow>

  @Field(() => ID)
  @prop({ ref: IntegrationTrigger, required: true })
  readonly integrationTrigger!: Reference<IntegrationTrigger>

  @Field()
  @prop({ required: true })
  name: string

  // It should be nullable in order to return an empty object
  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp({ required: true })
  inputs?: Record<string, any>

  @Field(() => AccountCredential, { nullable: true })
  @prop({ ref: AccountCredential })
  credentials?: Reference<AccountCredential>

  /**
   * After which time the trigger should be checked.
   * Defaulting to new date enables the trigger after creation.
   */
  @prop({ index: true })
  nextCheck?: Date

  @Field(() => GraphQLJSONObject, { nullable: true })
  @prop({ type: Schema.Types.Mixed })
  schedule?: TriggerSchedule

  @Field()
  @prop({ default: true, required: true })
  enabled: boolean = true

  /**
   * Number of consecutive failures to stop the workflow, or zero to disable it.
   */
  @Field(() => Int)
  @prop({ default: 3 })
  maxConsecutiveFailures: number = 3

  /**
   * Track consecutive workflow failures in order to disable the trigger if it keeps failing
   */
  @prop({ default: 0 })
  consecutiveWorkflowFails: number = 0

  /**
   * Last ID fetched from the integration. Triggers fire if last ID changes.
   */
  @prop()
  lastId?: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  lastItem?: Record<string, any>

  @Field({ nullable: true })
  @prop({ index: true, sparse: true })
  hookId?: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  schemaResponse?: JSONSchema7

  // generic store to save data relative to the workflow trigger like ids fetched
  @jsonProp()
  store?: Record<string, any>

  // it will always be the same as workflow.isPublic
  @prop()
  isPublic?: boolean
}

@InputType()
export class CreateWorkflowTriggerInput {
  @Field(() => ID)
  workflow: Reference<Workflow>

  @Field(() => ID)
  integrationTrigger: Reference<IntegrationTrigger>

  @Field(() => GraphQLJSONObject)
  inputs: object

  @Field(() => ID, { nullable: true })
  credentials?: Reference<AccountCredential>

  @Field(() => GraphQLJSONObject, { nullable: true })
  schedule?: TriggerSchedule

  @Field({ nullable: true })
  enabled?: boolean

  @Field(() => Int, { nullable: true })
  maxConsecutiveFailures?: number
}

@InputType()
export class UpdateWorkflowTriggerInput {
  @Field({ nullable: true })
  name?: string

  @Field(() => GraphQLJSONObject, { nullable: true })
  inputs?: object

  @Field(() => ID, { nullable: true })
  credentials?: Reference<AccountCredential>

  @Field(() => GraphQLJSONObject, { nullable: true })
  schedule?: TriggerSchedule

  @Field({ nullable: true })
  enabled?: boolean

  @Field(() => Int, { nullable: true })
  maxConsecutiveFailures?: number
}
