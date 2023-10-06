import { BaseService } from '@app/common/base/base.service'
import { ChainId } from '@blockchain/blockchain/types/ChainId'
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { mongoose, ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'bson'
import { Cache } from 'cache-manager'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { Integration } from '../../integrations/entities/integration'
import { NotificationMessages } from '../../users/notification-messages'
import { UserNotificationService } from '../../users/services/user-notifications.service'
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

export interface TriggerItem {
  id: string | number
  item: any
}

@Injectable()
export class WorkflowRunService extends BaseService<WorkflowRun> {
  protected readonly logger = new Logger(WorkflowRunService.name)

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    @InjectModel(WorkflowRun) protected readonly model: ReturnModelType<typeof WorkflowRun>,
    private readonly userService: UserService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowSleepService: WorkflowSleepService,
    private readonly notificationService: UserNotificationService,
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
  async updateWorkflowRunStatus(workflowRunId: ObjectId, status: WorkflowRunStatus): Promise<void> {
    await this.updateOneNative(
      { _id: workflowRunId, status: WorkflowRunStatus.running },
      {
        $set: {
          status,
        },
        // If the workflow run is completed, remove the trigger items and lock
        ...(status === WorkflowRunStatus.completed ? { $unset: { triggerItems: '', lockedAt: '' } } : {}),
        // If the workflow run failed, remove the lock
        ...(status === WorkflowRunStatus.failed ? { $unset: { lockedAt: '' } } : {}),
      },
    )
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
      ...(hasRootAction ? { lockedAt: new Date() } : {}),
      triggerRun: {
        integrationName: integration.name,
        operationName: integrationTrigger.name,
        workflowTrigger: workflowTrigger._id,
        workflowTriggered: hasRootAction,
        status: WorkflowRunStatus.completed,
        finishedAt: new Date(),
      },
    })
    await this.userService.incrementOperationsUsed(workflow.owner as ObjectId, true)
    return workflowRun
  }

  async createCompletedTriggerRun(
    userId: ObjectId,
    workflowRunData: Partial<WorkflowRun>,
    triggerIds: string[],
    triggerItems: Array<Record<string, any>>,
    creditsUsed: number,
  ): Promise<WorkflowRun> {
    if (!workflowRunData.triggerRun) {
      throw new Error('triggerRun is required')
    }
    workflowRunData.triggerRun = {
      ...workflowRunData.triggerRun,
      status: WorkflowRunStatus.completed,
      workflowTriggered: true,
      triggerIds,
      finishedAt: new Date(),
    }
    workflowRunData.operationsUsed = creditsUsed
    workflowRunData.status = WorkflowRunStatus.running
    workflowRunData.lockedAt = new Date()
    const workflowRun = await this.createOne(workflowRunData)
    await this.cacheManager.set(`TRIGGER_ITEMS_${workflowRun.id}`, triggerItems, { ttl: 60 * 60 * 3 } as any)
    await this.userService.incrementOperationsUsed(userId, true, creditsUsed)
    return workflowRun
  }

  async createFailedTriggerRun(
    workflow: Workflow,
    workflowRunData: Partial<WorkflowRun>,
    errorMessage: string | undefined,
    errorResponse?: string,
    inputs?: Record<string, any>,
  ): Promise<WorkflowRun> {
    if (!workflowRunData.triggerRun) {
      throw new Error('triggerRun is required')
    }
    workflowRunData.triggerRun = {
      ...workflowRunData.triggerRun,
      status: WorkflowRunStatus.failed,
      workflowTriggered: false,
      finishedAt: new Date(),
    }
    workflowRunData.operationsUsed = 1
    workflowRunData.status = WorkflowRunStatus.failed
    workflowRunData.errorMessage = errorMessage
    workflowRunData.errorResponse = errorResponse
    workflowRunData.inputs = inputs
    delete workflowRunData.lockedAt
    const workflowRun = await this.createOne(workflowRunData)

    await this.userService.incrementOperationsUsed(new ObjectId(workflow.owner.toString()), false)
    const trigger = await this.workflowTriggerService.incrementWorkflowRunFailures(workflowRun.workflow, 'trigger')
    await this.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)

    // if the trigger was disabled and user is subscribed to notifications, send an email
    if (trigger && !trigger.enabled && workflowRun.startedBy !== WorkflowRunStartedByOptions.user) {
      await this.notificationService.sendNotification(
        workflow.ownerAddress,
        NotificationMessages.workflowDisabled(workflow, trigger.consecutiveTriggerFails),
      )
    }

    return workflowRun
  }

  async addRunningAction(
    workflowRunId: mongoose.Types.ObjectId,
    workflowAction: mongoose.Types.ObjectId,
    triggerItemId: string | number,
    integrationName: string,
    operationName: string,
  ): Promise<WorkflowRunAction> {
    const run = await this.findByIdAndUpdate(
      workflowRunId,
      {
        $push: {
          actionRuns: {
            itemId: triggerItemId,
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
    creditsUsed: number,
    transactions?: Array<{ hash: string; chainId: ChainId }>,
    sleeping?: boolean,
  ): Promise<void> {
    await this.updateManyNative(
      { _id: workflowRunId, 'actionRuns._id': workflowRunAction._id },
      {
        $set: {
          'actionRuns.$.status': sleeping ? WorkflowRunStatus.sleeping : WorkflowRunStatus.completed,
          'actionRuns.$.finishedAt': Date.now(),
          'actionRuns.$.transactions': transactions,
          lockedAt: new Date(),
        },
        $inc: { operationsUsed: creditsUsed },
      },
    )
    await this.userService.incrementOperationsUsed(userId, true, creditsUsed)
  }

  async markActionAsFailed(
    workflow: Workflow,
    workflowRun: WorkflowRun,
    workflowAction: WorkflowRunAction,
    errorMessage: string | undefined,
    errorResponse?: string,
    inputs?: Record<string, any>,
  ): Promise<void> {
    await this.updateManyNative(
      { _id: workflowRun._id, 'actionRuns._id': workflowAction._id },
      {
        $set: {
          'actionRuns.$.status': WorkflowRunStatus.failed,
          'actionRuns.$.finishedAt': Date.now(),
          errorMessage,
          errorResponse,
          inputs,
        },
        $unset: {
          lockedAt: '',
        },
        $inc: { operationsUsed: 1 },
      },
    )
    await this.userService.incrementOperationsUsed(new ObjectId(workflow.owner.toString()), false)
    if (workflowRun.status !== WorkflowRunStatus.failed) {
      const trigger = await this.workflowTriggerService.incrementWorkflowRunFailures(workflowRun.workflow, 'action')
      await this.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
      workflowRun.status = WorkflowRunStatus.failed

      if (trigger && !trigger.enabled && workflowRun.startedBy !== WorkflowRunStartedByOptions.user) {
        await this.notificationService.sendNotification(
          workflow.ownerAddress,
          NotificationMessages.workflowDisabled(workflow, trigger.consecutiveTriggerFails),
        )
      }
    }
  }

  async sleepWorkflowRun(
    workflow: Workflow,
    workflowRun: WorkflowRun,
    workflowAction: WorkflowAction,
    nextActionInputs: Record<string, Record<string, unknown>>,
    triggerItemId: string | number,
    sleepUntil?: Date,
    uniqueGroup?: string,
    repeatOnWakeUp?: boolean,
  ): Promise<void> {
    await this.workflowSleepService.createOne({
      workflow: workflow._id,
      workflowRun: workflowRun._id,
      workflowAction: workflowAction._id,
      nextActionInputs,
      itemId: triggerItemId,
      sleepUntil,
      uniqueGroup,
      repeat: repeatOnWakeUp,
    })
    await this.updateOne(workflowRun.id, { status: WorkflowRunStatus.sleeping })
  }

  async wakeUpWorkflowRun(workflowRun: WorkflowRun): Promise<void> {
    workflowRun.status = WorkflowRunStatus.running
    workflowRun.lockedAt = new Date()
    await this.updateOne(workflowRun.id, { status: workflowRun.status, lockedAt: workflowRun.lockedAt })
  }

  async interruptWorkflowRun(
    workflowRun: WorkflowRun,
    workflowRunAction: WorkflowRunAction,
    previousOutputs: Record<string, Record<string, unknown>>,
  ): Promise<void> {
    delete workflowRun.lockedAt
    await this.updateOneNative({ _id: workflowRun._id }, { $unset: { lockedAt: '' } })
    await this.cacheManager.set(`RUN_ACTION_OUTPUTS_${workflowRunAction.id}`, previousOutputs, {
      ttl: 60 * 60 * 3,
    } as any)
  }

  async getTriggerItems(workflowRunId: ObjectId): Promise<TriggerItem[] | undefined> {
    return await this.cacheManager.get(`TRIGGER_ITEMS_${workflowRunId}`)
  }

  async getWorkflowRunActionPreviousOutputs(workflowRunActionId: ObjectId): Promise<Record<string, any> | undefined> {
    return await this.cacheManager.get(`RUN_ACTION_OUTPUTS_${workflowRunActionId}`)
  }
}
