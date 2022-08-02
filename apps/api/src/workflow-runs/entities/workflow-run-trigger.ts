import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, ObjectType } from '@nestjs/graphql'
import { prop } from '@typegoose/typegoose'
import { EntityRef } from '../../../../../libs/common/src/decorators/entity-ref.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { WorkflowTrigger } from '../../workflow-triggers/entities/workflow-trigger'
import { WorkflowRunStatus } from './workflow-run-status'

@ObjectType()
@EntityRef('workflowTrigger', () => WorkflowTrigger)
export class WorkflowRunTrigger {
  @Field(() => ID, { nullable: true })
  @prop({ ref: WorkflowTrigger })
  workflowTrigger?: Reference<WorkflowTrigger>

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
  workflowTriggered?: boolean

  @Field(() => [String], { nullable: true })
  @prop({ dim: 1, type: String })
  triggerIds?: string[]

  @Field({ nullable: true })
  @prop()
  finishedAt?: Date
}
