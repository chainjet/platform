import { BaseEntity } from '@app/common/base/base-entity'
import { EntityConnection, EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { FilterableField } from '@nestjs-query/query-graphql'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { pre, prop, Ref } from '@typegoose/typegoose'
import { Project } from '../../projects/entities/project'
import { User } from '../../users/entities/user'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from '../../workflow-triggers/entities/workflow-trigger'

enum WorkflowState {
  Waiting = 'waiting',
  Scheduling = 'scheduling',
  Running = 'running'
}

@pre<Workflow>('save', function () {
  if (this.isModified('state')) {
    this.lastStateChange = new Date()
  }
})

@ObjectType()
@OwnedEntity()
@EntityRef('owner', () => User)
@EntityRef('project', () => Project)
@EntityRef('trigger', () => WorkflowTrigger, { nullable: true, relationName: '.workflow' })
@EntityConnection('actions', () => WorkflowAction, { nullable: true, relationName: '.workflow' })
export class Workflow extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: User, required: true, index: true })
  readonly owner: Reference<User>

  @FilterableField(() => ID)
  @prop({ ref: Project, required: true })
  readonly project: Reference<Project>

  @FilterableField()
  @prop({ required: true })
  name: string

  @FilterableField()
  @prop({ required: true, unique: true })
  slug: string

  @Field({ nullable: true })
  @prop({ enum: WorkflowState })
  state: WorkflowState

  /**
   * When was the last time the workflow state was changed.
   * Used to timeout workflow states.
   */
  @prop()
  lastStateChange: Date

  @Field(() => ID, { nullable: true })
  @prop({ ref: Workflow })
  runOnFailure?: Reference<Workflow>
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  name: string

  @Field(() => ID)
  project: Ref<Project>

  @Field(() => ID, { nullable: true })
  runOnFailure?: Reference<Workflow>
}

@InputType()
export class UpdateWorkflowInput {
  @Field({ nullable: true })
  name: string

  @Field(() => ID, { nullable: true })
  runOnFailure?: Reference<Workflow>
}
