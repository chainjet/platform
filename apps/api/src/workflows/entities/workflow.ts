import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizerWithCustomPrivacy } from '@app/common/base/owned.authorizer'
import { EntityConnection, EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { pre, prop } from '@typegoose/typegoose'
import { GraphQLBoolean, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { User } from '../../users/entities/user'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from '../../workflow-triggers/entities/workflow-trigger'

enum WorkflowState {
  Waiting = 'waiting',
  Scheduling = 'scheduling',
  Running = 'running',
}

@Injectable()
export class WorkflowAuthorizer extends OwnedAuthorizerWithCustomPrivacy<Workflow> {
  sharableRelations = ['integration', 'integrationAction', 'integrationTrigger', 'trigger', 'actions']
}

@pre<Workflow>('save', function () {
  if (this.isModified('state')) {
    this.lastStateChange = new Date()
  }
})
@ObjectType()
@OwnedEntity()
@Authorize<Workflow>(WorkflowAuthorizer)
@EntityRef('owner', () => User)
@EntityRef('trigger', () => WorkflowTrigger, { nullable: true, relationName: '.workflow' })
@EntityConnection('actions', () => WorkflowAction, {
  nullable: true,
  relationName: '.workflow',
  defaultResultSize: 40,
})
export class Workflow extends BaseEntity {
  @FilterableField(() => ID)
  @prop({ ref: User, required: true, index: true })
  readonly owner: Reference<User>

  @FilterableField()
  @prop({ required: true })
  name: string

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

  // deployed address
  @Field(() => GraphQLString, { nullable: true })
  @prop()
  address?: string

  @Field(() => GraphQLString, { nullable: true })
  @prop()
  network?: string

  @Field(() => GraphQLBoolean, { nullable: true })
  @prop()
  isTemplate?: boolean

  @prop()
  isPublic?: boolean

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  templateSchema?: JSONSchema7
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  name: string

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
