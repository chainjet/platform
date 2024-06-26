import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizerWithCustomPrivacy } from '@app/common/base/owned.authorizer'
import { EntityConnection, EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { Field, ID, InputType, ObjectType } from '@nestjs/graphql'
import { Authorize, FilterableField } from '@ptc-org/nestjs-query-graphql'
import { prop } from '@typegoose/typegoose'
import { getAddress, isAddress } from 'ethers/lib/utils'
import { GraphQLBoolean, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { Integration } from '../../integrations/entities/integration'
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
  sharableRelations = [
    'integration',
    'integrationAction',
    'integrationTrigger',
    'integrationAccount',
    'trigger',
    'actions',
    'action',
  ]
}

@ObjectType()
@OwnedEntity()
@Authorize<Workflow>(WorkflowAuthorizer)
@EntityRef('trigger', () => WorkflowTrigger, { nullable: true, relationName: '.workflow' })
@EntityConnection('actions', () => WorkflowAction, {
  nullable: true,
  relationName: '.workflow',
  defaultResultSize: 40,
})
export class Workflow extends BaseEntity {
  @prop({ ref: User, required: true, index: true })
  readonly owner: Reference<User>

  @Field(() => GraphQLString)
  @prop({ required: true, validate: isAddress, set: (addr) => addr && getAddress(addr) })
  ownerAddress: string

  @FilterableField()
  @prop({ required: true })
  name: string

  @Field({ nullable: true })
  @prop({ enum: WorkflowState })
  state: WorkflowState

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

  /**
   * Special workflow type
   */
  @FilterableField(() => GraphQLString, { nullable: true })
  @prop()
  type?: 'chatbot'

  @Field(() => GraphQLBoolean, { nullable: true })
  @prop()
  isTemplate?: boolean

  @Field(() => GraphQLBoolean, { defaultValue: false })
  @prop()
  isPublic?: boolean

  @prop({ index: true })
  isListed?: boolean

  @Field(() => GraphQLJSONObject, { nullable: true })
  @jsonProp()
  templateSchema?: JSONSchema7

  @Field(() => [GraphQLString], { nullable: true })
  @prop({ ref: () => Integration })
  usedIntegrations: Reference<Integration>[]

  @prop({ ref: Workflow })
  readonly forkOf?: Reference<Workflow>
}

@InputType()
export class CreateWorkflowInput {
  @Field()
  name: string

  @Field(() => GraphQLString, { nullable: true })
  type?: 'chatbot'

  @Field(() => ID, { nullable: true })
  runOnFailure?: Reference<Workflow>

  @Field(() => GraphQLBoolean, { nullable: true })
  isPublic?: boolean

  @Field(() => GraphQLJSONObject, { nullable: true })
  templateSchema?: JSONSchema7
}

@InputType()
export class UpdateWorkflowInput {
  @Field({ nullable: true })
  name: string

  @Field(() => ID, { nullable: true })
  runOnFailure?: Reference<Workflow>

  @Field(() => GraphQLBoolean, { nullable: true })
  isPublic?: boolean

  @Field(() => GraphQLJSONObject, { nullable: true })
  templateSchema?: JSONSchema7
}
