import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, Int, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { EntityRef } from '../../../../../libs/common/src/decorators/entity-ref.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { User } from '../../users/entities/user'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowRunAction } from './workflow-run-action'
import { WorkflowRunStartedByOptions } from './workflow-run-started-by-options'
import { WorkflowRunStatus } from './workflow-run-status'
import { WorkflowRunTrigger } from './workflow-run-trigger'

@ObjectType()
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
}
