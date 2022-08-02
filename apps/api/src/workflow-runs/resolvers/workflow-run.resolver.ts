import { BaseResolver } from '@app/common/base/base.resolver'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { OwnedAuthorizer } from '../../../../../libs/common/src/base/owned.authorizer'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunService } from '../services/workflow-run.service'

@Injectable()
export class WorkflowRunAuthorizer extends OwnedAuthorizer<WorkflowRun> {}

@Resolver(() => WorkflowRun)
@UseGuards(GraphqlGuard)
export class WorkflowRunResolver extends BaseResolver(WorkflowRun, {
  read: {
    maxResultsSize: 60,
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
  guards: [GraphqlGuard],
}) {
  constructor(
    protected workflowRunService: WorkflowRunService,
    @InjectAuthorizer(WorkflowRun) readonly authorizer: Authorizer<WorkflowRun>,
  ) {
    super(workflowRunService)
  }
}
