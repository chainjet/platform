import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { EntityRef } from '../../../../../libs/common/src/decorators/entity-ref.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowRunStatus } from './workflow-run-status'

@ObjectType()
@EntityRef('workflowAction', () => WorkflowAction)
export class WorkflowRunAction extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @prop({ ref: WorkflowAction })
  workflowAction: Reference<WorkflowAction>

  @Field()
  @prop({ required: true })
  integrationName: string

  @Field()
  @prop({ required: true })
  operationName: string

  @FilterableField(() => WorkflowRunStatus)
  @prop({ enum: WorkflowRunStatus, type: String, required: true })
  status: WorkflowRunStatus

  @Field({ nullable: true })
  @prop()
  finishedAt: Date
}
