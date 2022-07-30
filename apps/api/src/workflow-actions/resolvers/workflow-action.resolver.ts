import { BaseResolver } from '@app/common/base/base.resolver'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateWorkflowActionInput, UpdateWorkflowActionInput, WorkflowAction } from '../entities/workflow-action'
import { WorkflowActionService } from '../services/workflow-action.service'

@Injectable()
export class WorkflowActionAuthorizer extends OwnedAuthorizer<WorkflowAction> {}

@Resolver(() => WorkflowAction)
@UseGuards(GraphqlGuard)
export class WorkflowActionResolver extends BaseResolver(WorkflowAction, {
  CreateDTOClass: CreateWorkflowActionInput,
  UpdateDTOClass: UpdateWorkflowActionInput,
  guards: [GraphqlGuard]
}) {
  constructor (
    protected workflowActionService: WorkflowActionService,
    @InjectAuthorizer(WorkflowAction) readonly authorizer: Authorizer<WorkflowAction>
  ) {
    super(workflowActionService)
  }
}
