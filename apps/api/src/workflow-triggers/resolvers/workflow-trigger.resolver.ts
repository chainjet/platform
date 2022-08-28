import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { GraphQLString } from 'graphql'
import { ObjectId } from 'mongoose'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { WorkflowRunStartedByOptions } from '../../workflow-runs/entities/workflow-run-started-by-options'
import { CreateWorkflowTriggerInput, UpdateWorkflowTriggerInput, WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'

@Resolver(() => WorkflowTrigger)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(WorkflowTrigger))
export class WorkflowTriggerResolver extends BaseResolver(WorkflowTrigger, {
  CreateDTOClass: CreateWorkflowTriggerInput,
  UpdateDTOClass: UpdateWorkflowTriggerInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly runnerService: RunnerService,
  ) {
    super(workflowTriggerService)
  }

  @Mutation(() => WorkflowTrigger)
  async checkWorkflowTrigger(
    @UserId() userId: ObjectId,
    @Args('id', { type: () => GraphQLString }) id: string,
  ): Promise<WorkflowTrigger | null> {
    const trigger = await this.workflowTriggerService.findById(id)
    if (!trigger || trigger.owner.toString() !== userId.toString() || !trigger.schedule?.frequency) {
      return null
    }
    void this.runnerService.runWorkflowTriggerCheck(trigger, WorkflowRunStartedByOptions.user) // TODO replace with queues
    await this.workflowTriggerService.updateNextCheck(trigger)
    return trigger
  }
}
