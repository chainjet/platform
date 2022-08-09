import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateWorkflowActionInput, UpdateWorkflowActionInput, WorkflowAction } from '../entities/workflow-action'
import { WorkflowActionService } from '../services/workflow-action.service'

@Resolver(() => WorkflowAction)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(WorkflowAction))
export class WorkflowActionResolver extends BaseResolver(WorkflowAction, {
  CreateDTOClass: CreateWorkflowActionInput,
  UpdateDTOClass: UpdateWorkflowActionInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected workflowActionService: WorkflowActionService, // @InjectAuthorizer(WorkflowAction) readonly authorizer: Authorizer<WorkflowAction>,
  ) {
    super(workflowActionService)
  }
}
