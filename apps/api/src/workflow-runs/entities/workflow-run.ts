import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Injectable } from '@nestjs/common'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { GraphQLJSONObject } from 'graphql-type-json'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { EntityRef } from '../../../../../libs/common/src/decorators/entity-ref.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { User } from '../../users/entities/user'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowRunAction } from './workflow-run-action'
import { WorkflowRunStartedByOptions } from './workflow-run-started-by-options'
import { WorkflowRunStatus } from './workflow-run-status'
import { WorkflowRunTrigger } from './workflow-run-trigger'

@Injectable()
export class WorkflowRunAuthorizer extends OwnedAuthorizer<WorkflowRun> {}

// OwnedEntity is not needed because workflow runs cannot be created by the user
@ObjectType()
@Authorize<WorkflowRun>(WorkflowRunAuthorizer)
@EntityRef('workflow', () => Workflow)
export class WorkflowRun extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: Workflow, required: true, index: true })
  workflow: Reference<Workflow>

  @FilterableField(() => WorkflowRunStatus)
  @prop({ enum: WorkflowRunStatus, type: String, required: true })
  status: WorkflowRunStatus

  @Field(() => WorkflowRunTrigger, { nullable: true })
  @prop({ _id: false, type: WorkflowRunTrigger })
  triggerRun: WorkflowRunTrigger

  @Field(() => [WorkflowRunAction])
  @prop({ type: WorkflowRunAction, default: [] })
  actionRuns: WorkflowRunAction[]

  @FilterableField(() => WorkflowRunStartedByOptions)
  @prop({ enum: WorkflowRunStartedByOptions, type: String, required: true })
  startedBy: WorkflowRunStartedByOptions

  @Field(() => Int)
  @prop({ default: 0, required: true })
  operationsUsed: number

  @Field({ nullable: true })
  @prop()
  errorMessage: string

  @Field({ nullable: true })
  @prop()
  errorResponse: string

  /**
   * Trigger run response data. This is stored while the workflow is running or if it failed.
   */
  @jsonProp()
  triggerItems?: Array<Record<string, any>>

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  inputs?: Record<string, any>

  @prop({ index: true })
  lockedAt?: Date
}
