import { BaseResolver } from '@app/common/base/base.resolver'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { GraphQLString } from 'graphql'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { WorkflowRunStartedByOptions } from '../../workflow-runs/entities/workflow-run-started-by-options'
import { CreateWorkflowTriggerInput, UpdateWorkflowTriggerInput, WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'

@Injectable()
export class WorkflowTriggerAuthorizer extends OwnedAuthorizer<WorkflowTrigger> {}

@Resolver(() => WorkflowTrigger)
@UseGuards(GraphqlGuard)
export class WorkflowTriggerResolver extends BaseResolver(WorkflowTrigger, {
  CreateDTOClass: CreateWorkflowTriggerInput,
  UpdateDTOClass: UpdateWorkflowTriggerInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly runnerService: RunnerService,
    @InjectAuthorizer(WorkflowTrigger) readonly authorizer: Authorizer<WorkflowTrigger>,
  ) {
    super(workflowTriggerService)
  }

  // TODO owner guard
  @Mutation(() => WorkflowTrigger)
  async checkWorkflowTrigger(@Args('id', { type: () => GraphQLString }) id: string): Promise<WorkflowTrigger | null> {
    const trigger = await this.workflowTriggerService.findById(id)
    if (!trigger || !trigger.schedule?.frequency) {
      return null
    }
    void this.runnerService.runWorkflowTriggerCheck(trigger, WorkflowRunStartedByOptions.user) // TODO replace with queues
    await this.workflowTriggerService.updateNextCheck(trigger)
    return trigger
  }
}
