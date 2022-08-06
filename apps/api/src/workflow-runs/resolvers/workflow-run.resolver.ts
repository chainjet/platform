import { BaseResolver } from '@app/common/base/base.resolver'
import { Injectable, UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { OwnedAuthorizer } from '../../../../../libs/common/src/base/owned.authorizer'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunService } from '../services/workflow-run.service'

@Injectable()
export class WorkflowRunAuthorizer extends OwnedAuthorizer<WorkflowRun> {}

@Resolver(() => WorkflowRun)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(WorkflowRun))
export class WorkflowRunResolver extends BaseResolver(WorkflowRun, {
  read: {
    maxResultsSize: 60,
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
  guards: [GraphqlGuard],
}) {
  constructor(protected workflowRunService: WorkflowRunService) {
    super(workflowRunService)
  }
}
