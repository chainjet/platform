import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { mongoose, ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'bson'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { Integration } from '../../integrations/entities/integration'
import { UserService } from '../../users/services/user.service'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from '../../workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunAction } from '../entities/workflow-run-action'
import { WorkflowRunStartedByOptions } from '../entities/workflow-run-started-by-options'
import { WorkflowRunStatus } from '../entities/workflow-run-status'
import { WorkflowSleepService } from './workflow-sleep.service'

@Injectable()
export class WorkflowRunService extends BaseService<WorkflowRun> {
  protected readonly logger = new Logger(WorkflowRunService.name)

  constructor(
    @InjectModel(WorkflowRun) protected readonly model: ReturnModelType<typeof WorkflowRun>,
    private readonly userService: UserService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowSleepService: WorkflowSleepService,
  ) {
    super(model)
  }

  async markWorkflowRunAsCompleted(workflowRunId: ObjectId): Promise<void> {
    await this.updateWorkflowRunStatus(workflowRunId, WorkflowRunStatus.completed)
  }

  /**
   * Update workflow run status respecting the status state machine.
   * Once the status is completed or failed it's final and cannot be updated
   */
  protected async updateWorkflowRunStatus(workflowRunId: ObjectId, status: WorkflowRunStatus): Promise<void> {
    await this.updateOneNative({ _id: workflowRunId, status: WorkflowRunStatus.running }, { $set: { status } })
  }

  async createOneByInstantTrigger(
    integration: Integration,
    integrationTrigger: IntegrationTrigger,
    workflow: Workflow,
    workflowTrigger: WorkflowTrigger,
    hasRootAction: boolean,
  ): Promise<WorkflowRun> {
    const workflowRun = await this.createOne({
      owner: workflow.owner,
      workflow: workflow._id,
      status: hasRootAction ? WorkflowRunStatus.running : WorkflowRunStatus.completed,
      startedBy: WorkflowRunStartedByOptions.trigger,
      operationsUsed: 1,
      triggerRun: {
        integrationName: integration.name,
        operationName: integrationTrigger.name,
        workflowTrigger: workflowTrigger._id,
        workflowTriggered: hasRootAction,
        status: WorkflowRunStatus.completed,
        finishedAt: new Date(),
      },
    })
    await this.userService.incrementOperationsUsed(workflow.owner as ObjectId)
    return workflowRun
  }

  async markTriggerAsCompleted(
    userId: ObjectId,
    workflowRunId: ObjectId,
    workflowTriggered: boolean,
    triggerIds?: string[],
  ): Promise<void> {
    await this.updateById(workflowRunId, {
      $set: {
        'triggerRun.status': WorkflowRunStatus.completed,
        'triggerRun.workflowTriggered': workflowTriggered,
        'triggerRun.triggerIds': triggerIds,
        'triggerRun.finishedAt': Date.now(),
      },
      $inc: { operationsUsed: 1 },
    })
    await this.userService.incrementOperationsUsed(userId)
    if (!workflowTriggered) {
      await this.markWorkflowRunAsCompleted(workflowRunId)
    }
  }

  // TODO only increase operations used if failed was because of a client issue
  async markTriggerAsFailed(
    userId: ObjectId,
    workflowRun: WorkflowRun,
    errorMessage: string | undefined,
    errorResponse?: string,
  ): Promise<void> {
    await this.updateById(workflowRun._id, {
      $set: {
        'triggerRun.status': WorkflowRunStatus.failed,
        'triggerRun.finishedAt': Date.now(),
        errorMessage,
        errorResponse,
      },
      $inc: { operationsUsed: 1 },
    })
    await this.userService.incrementOperationsUsed(userId)
    await this.workflowTriggerService.incrementWorkflowRunFailures(workflowRun.workflow)
    await this.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
  }

  async addRunningAction(
    workflowRunId: mongoose.Types.ObjectId,
    workflowAction: mongoose.Types.ObjectId,
    integrationName: string,
    operationName: string,
  ): Promise<WorkflowRunAction> {
    const run = await this.findByIdAndUpdate(
      workflowRunId,
      {
        $push: {
          actionRuns: {
            integrationName,
            operationName,
            workflowAction,
            status: WorkflowRunStatus.running,
          },
        },
      },
      { new: true },
    )
    const runAction = run?.actionRuns
      .reverse()
      .find((action) => action.workflowAction.toString() === workflowAction.toString())
    if (!runAction) {
      throw new Error('WorkflowRunAction not created')
    }
    return runAction
  }

  async markActionAsCompleted(
    userId: ObjectId,
    workflowRunId: ObjectId,
    workflowRunAction: WorkflowRunAction,
  ): Promise<void> {
    await this.update(
      { _id: workflowRunId, 'actionRuns._id': workflowRunAction._id },
      {
        $set: {
          'actionRuns.$.status': WorkflowRunStatus.completed,
          'actionRuns.$.finishedAt': Date.now(),
        },
        $inc: { operationsUsed: 1 },
      },
    )
    await this.userService.incrementOperationsUsed(userId)
  }

  // TODO only increase operations used if failed was because of a client issue
  async markActionAsFailed(
    userId: ObjectId,
    workflowRun: WorkflowRun,
    workflowAction: WorkflowRunAction,
    errorMessage: string | undefined,
    errorResponse?: string,
  ): Promise<void> {
    await this.update(
      { _id: workflowRun._id, 'actionRuns._id': workflowAction._id },
      {
        $set: {
          'actionRuns.$.status': WorkflowRunStatus.failed,
          'actionRuns.$.finishedAt': Date.now(),
          errorMessage,
          errorResponse,
        },
        $inc: { operationsUsed: 1 },
      },
    )
    await this.userService.incrementOperationsUsed(userId)
    await this.workflowTriggerService.incrementWorkflowRunFailures(workflowRun.workflow)
    await this.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
  }

  async sleepWorkflowRun(
    workflowRun: WorkflowRun,
    workflowAction: WorkflowAction,
    nextActionInputs: Record<string, Record<string, unknown>>,
    sleepUntil: Date,
  ): Promise<void> {
    await this.workflowSleepService.createOne({
      workflowRun: workflowRun._id,
      workflowAction: workflowAction._id,
      nextActionInputs,
      sleepUntil,
    })
    await this.updateOne(workflowRun.id, { status: WorkflowRunStatus.sleeping })
  }

  async wakeUpWorkflowRun(workflowRun: WorkflowRun): Promise<void> {
    workflowRun.status = WorkflowRunStatus.running
    await this.updateOne(workflowRun.id, { status: workflowRun.status })
  }
}
