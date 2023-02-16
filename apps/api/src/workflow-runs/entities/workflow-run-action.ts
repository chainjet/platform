import { Field, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { EntityRef } from '../../../../../libs/common/src/decorators/entity-ref.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { BlockchainTransaction } from './blockchain-transaction'
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

  /**
   * ID of the trigger item that started this action
   */
  @Field(() => ID)
  @prop({ required: true })
  itemId: string | number

  @FilterableField(() => WorkflowRunStatus)
  @prop({ enum: WorkflowRunStatus, type: String, required: true })
  status: WorkflowRunStatus

  @Field({ nullable: true })
  @prop()
  finishedAt: Date

  @Field(() => [BlockchainTransaction], { nullable: true })
  @prop({ type: Object })
  transactions?: BlockchainTransaction[]
}
