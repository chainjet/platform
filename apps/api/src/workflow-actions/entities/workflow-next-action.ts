import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Field, ID, ObjectType } from '@nestjs/graphql'
import { FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { WorkflowAction } from './workflow-action'

@ObjectType()
@EntityRef('action', () => WorkflowAction)
export class WorkflowNextAction {
  @FilterableField(() => ID)
  @prop({ ref: 'WorkflowAction', required: true })
  action!: Reference<WorkflowAction>

  @Field({ nullable: true })
  @prop()
  condition?: string
}
