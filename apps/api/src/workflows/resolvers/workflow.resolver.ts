import { BaseResolver } from '@app/common/base/base.resolver'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateWorkflowInput, UpdateWorkflowInput, Workflow } from '../entities/workflow'
import { WorkflowService } from '../services/workflow.service'

@Injectable()
export class WorkflowAuthorizer extends OwnedAuthorizer<Workflow> {}

@Resolver(() => Workflow)
@UseGuards(GraphqlGuard)
export class WorkflowResolver extends BaseResolver(Workflow, {
  CreateDTOClass: CreateWorkflowInput,
  UpdateDTOClass: UpdateWorkflowInput,
  guards: [GraphqlGuard]
}) {
  constructor (
    protected workflowService: WorkflowService,
    @InjectAuthorizer(Workflow) readonly authorizer: Authorizer<Workflow>
  ) {
    super(workflowService)
  }
}
