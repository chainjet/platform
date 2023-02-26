import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRunStatus } from 'apps/api/src/workflow-runs/entities/workflow-run-status'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowRunStartedByOptions } from '../../../api/src/workflow-runs/entities/workflow-run-started-by-options'
import { WorkflowSleepService } from '../../../api/src/workflow-runs/services/workflow-sleep.service'
import { WorkflowTriggerService } from '../../../api/src/workflow-triggers/services/workflow-trigger.service'
import { RunnerService } from '../../../runner/src/services/runner.service'

@Injectable()
export class WorkflowSchedulerService {
  private readonly logger = new Logger(WorkflowSchedulerService.name)
  private processStopped: boolean = false

  constructor(
    private readonly runnerService: RunnerService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowSleepService: WorkflowSleepService,
    private readonly workflowRunService: WorkflowRunService,
  ) {}

  @Interval(10 * 1000)
  async scheduleTriggerChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processStopped) {
      await this.scheduleTriggerChecks()
    }
  }

  @Interval(10 * 1000)
  async scheduleSleepChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processStopped) {
      await this.scheduleSleepChecks()
    }
  }

  @Interval(10 * 1000)
  async scheduleTimedOutWorkflowsRetries(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processStopped) {
      await this.retryTimedOutWorkflows()
    }
  }

  async onModuleInit() {
    process.on('SIGTERM', () => this.onProcessInterrupted())
    process.on('SIGINT', () => this.onProcessInterrupted())
  }

  onModuleDestroy() {
    this.onProcessInterrupted()
  }

  onProcessInterrupted() {
    this.logger.log('Process interrupted, stopping schedulers')
    this.processStopped = true
  }

  async scheduleTriggerChecks(): Promise<void> {
    this.logger.log('Running trigger scheduler')

    // Get triggers to be checked
    const triggers = await this.workflowTriggerService.find({
      enabled: true,
      nextCheck: {
        $lt: new Date(),
      },
    })

    // Update next check time
    const triggersToRun: WorkflowTrigger[] = []
    for (const trigger of triggers) {
      const res = await this.workflowTriggerService.updateNextCheck(trigger)
      if (res) {
        triggersToRun.push(trigger)
      }
    }

    this.logger.log(`Found ${triggersToRun.length} triggers to be checked`)

    const promises = triggersToRun.map((trigger) =>
      this.runnerService.runWorkflowTriggerCheck(trigger, WorkflowRunStartedByOptions.trigger),
    )
    await Promise.all(promises)
  }

  async scheduleSleepChecks(): Promise<void> {
    this.logger.log('Running sleep scheduler')

    const workflowSleeps = await this.workflowSleepService.find({
      sleepUntil: {
        $lt: new Date(),
      },
    })

    this.logger.log(`Found ${workflowSleeps.length} workflows to be woken up`)

    await this.workflowSleepService.deleteManyNative({
      _id: {
        $in: workflowSleeps.map((workflowSleep) => workflowSleep._id),
      },
    })

    // TODO use a queue
    const promises = workflowSleeps.map((workflowSleep) => this.runnerService.wakeUpWorkflowRun(workflowSleep))
    await Promise.all(promises)
  }

  /**
   * Retry workflows that are still running 20 minutes after the last action was started
   */
  async retryTimedOutWorkflows(): Promise<void> {
    const twentyMinutesAgo = new Date(new Date().getTime() - 20 * 60 * 1000)
    const workflowRuns = await this.workflowRunService.find({
      lockedAt: {
        $lt: twentyMinutesAgo,
      },

      // we run must have triggerItems to continue the run
      triggerItems: {
        $exists: true,
      },
    })

    for (const workflowRun of workflowRuns) {
      if (workflowRun.status !== WorkflowRunStatus.running) {
        this.logger.warn(`Workflow Run has lockedAt but it's not running: ${workflowRun._id} ${workflowRun.status}`)
        await this.workflowRunService.updateOneNative({ _id: workflowRun._id }, { $unset: { lockedAt: '' } })
        continue
      }

      if (workflowRun.triggerRun?.status === 'running') {
        this.logger.log(`Workflow trigger timed out: ${workflowRun._id}`)
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
        continue
      }

      const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000)
      if (workflowRun.lockedAt!.getTime() < sixHoursAgo.getTime()) {
        this.logger.log(`Workflow run lock is too old (${workflowRun.lockedAt}): ${workflowRun._id}`)
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
        continue
      }

      // this is required only for old runs, in new ones itemId is a required field
      if (workflowRun.actionRuns.some((action) => !action.itemId)) {
        continue
      }

      const triggerItems = workflowRun.triggerItems
      const notCompletedTriggerItems = triggerItems?.filter((trigger) => {
        const action = workflowRun.actionRuns.find((action) => action.itemId === trigger.id)
        return !action || action.status === WorkflowRunStatus.running
      })
      if (!notCompletedTriggerItems?.length) {
        continue
      }

      const notStartedTriggerItems = notCompletedTriggerItems.filter((trigger) => {
        return !workflowRun.actionRuns.some(
          (action) => action.itemId === trigger.id && action.status === WorkflowRunStatus.completed,
        )
      })

      // TODO at the moment we can only retry runs that have not succesfully run any actions
      if (!notStartedTriggerItems.length) {
        continue
      }

      const workflowTrigger = await this.workflowTriggerService.findOne({
        workflow: workflowRun.workflow,
      })
      const workflowActions = await this.workflowActionService.find({
        workflow: workflowRun.workflow,
        isRootAction: true,
      })

      // workflow trigger or all workflow actions were removed
      if (!workflowTrigger || !workflowActions.length) {
        await this.workflowRunService.updateOneNative(
          { _id: workflowRun._id },
          {
            $set: { status: !workflowTrigger ? WorkflowRunStatus.failed : WorkflowRunStatus.completed },
            $unset: { lockedAt: '' },
          },
        )
        continue
      }

      if (workflowRun.retries && workflowRun.retries >= 2) {
        this.logger.log(`Workflow run timed out after too many retries: ${workflowRun._id}`)
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
        continue
      }

      // lock the execution if we have the latest version of the object (to avoid concurrent runs between workers)
      const res = await this.workflowRunService.updateOneNative(
        { _id: workflowRun._id, __v: workflowRun.__v },
        {
          $set: {
            lockedAt: new Date(),
            ...(!workflowRun.retries ? { retries: 1 } : {}),
          },
          ...(workflowRun.retries ? { $inc: { retries: 1 } } : {}),
        },
      )
      if (!res.modifiedCount) {
        continue
      }

      const triggerOutputs = notStartedTriggerItems.map((item) => ({
        id: item.id,
        outputs: { [workflowTrigger.id]: item.item, trigger: item.item },
      }))
      this.logger.log(`Retrying workflow run: ${workflowRun._id} with ${triggerOutputs.length} items`)
      await this.runnerService.runWorkflowActions(workflowActions, triggerOutputs, workflowRun)
    }
  }
}
