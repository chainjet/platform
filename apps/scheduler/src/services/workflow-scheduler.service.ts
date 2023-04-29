import { getDateFromObjectId } from '@app/common/utils/mongodb'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
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
  private processInterrupted: boolean = false

  constructor(
    private readonly runnerService: RunnerService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowSleepService: WorkflowSleepService,
    private readonly workflowRunService: WorkflowRunService,
  ) {}

  @Interval(10 * 1000 + Math.floor(Math.random() * 3000))
  async scheduleTriggerChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processInterrupted) {
      await this.scheduleTriggerChecks()
    }
  }

  @Interval(10 * 1000 + Math.floor(Math.random() * 3000))
  async scheduleSleepChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processInterrupted) {
      await this.scheduleSleepChecks()
    }
  }

  @Interval(10 * 1000 + Math.floor(Math.random() * 3000))
  async scheduleTimedOutWorkflowsRetries(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processInterrupted) {
      await this.resumeWorkflowRuns()
    }
  }

  onModuleDestroy() {
    this.logger.log('Process interrupted, stopping schedulers')
    this.processInterrupted = true
  }

  async scheduleTriggerChecks(): Promise<void> {
    this.logger.log('Running trigger scheduler')

    // Get triggers to be checked
    const triggers = await this.workflowTriggerService.find({
      enabled: true,
      planLimited: { $ne: true },
      nextCheck: {
        $lt: new Date(),
      },
      numberOfActions: { $gt: 0 },
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
   * Also retry runs interrupted. When we receive a SIGTERM, the lock on the run is immediately released
   */
  async resumeWorkflowRuns(): Promise<void> {
    const twentyMinutesAgo = new Date(new Date().getTime() - 20 * 60 * 1000)
    const workflowRuns = await this.workflowRunService.find(
      {
        $or: [
          // interrupted runs
          {
            lockedAt: {
              $exists: false,
            },
            status: WorkflowRunStatus.running,
          },
          // timed out runs
          {
            lockedAt: {
              $lt: twentyMinutesAgo,
            },
          },
        ],
      },
      undefined,
      {
        // limit to 100 runs to prevent single workers from running out of memory if a large queue builds up
        limit: 100,
      },
    )

    const timedOutRuns = workflowRuns.filter(
      (workflowRun) => workflowRun.lockedAt && workflowRun.lockedAt < twentyMinutesAgo,
    )
    const interruptedRuns = workflowRuns.filter((workflowRun) => !workflowRun.lockedAt)
    this.logger.log(`Found ${timedOutRuns.length} timed out workflow runs`)
    this.logger.log(`Found ${interruptedRuns.length} interrupted workflow runs`)

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
      const runCreatedAt = getDateFromObjectId(workflowRun._id)
      if (runCreatedAt.getTime() < sixHoursAgo.getTime()) {
        this.logger.log(`Workflow run is too old (${runCreatedAt}): ${workflowRun._id}`)
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
        continue
      }

      // this is required only for old runs, in new ones itemId is a required field
      if (workflowRun.actionRuns.some((action) => !action.itemId)) {
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
        continue
      }

      const triggerItems = await this.workflowRunService.getTriggerItems(workflowRun._id)
      const notCompletedTriggerItems = triggerItems?.filter((trigger) => {
        const actions = workflowRun.actionRuns.filter((action) => action.itemId === trigger.id)
        return !actions.length || actions.some((action) => action.status === WorkflowRunStatus.running)
      })
      if (!notCompletedTriggerItems?.length) {
        // everything was completed but workflow not marked as completed
        await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.completed)
        continue
      }

      const startedTriggerItems = notCompletedTriggerItems.filter((trigger) => {
        return workflowRun.actionRuns.some(
          (action) => action.itemId === trigger.id && action.status === WorkflowRunStatus.completed,
        )
      })

      // Run started trigger items (from the latest completed action)
      const success = await this.runnerService.runTriggerItemsFromLatestAction(workflowRun, startedTriggerItems)

      // Run not started trigger items (from the root action)
      const notStartedTriggerItems = notCompletedTriggerItems.filter(
        (trigger) => !startedTriggerItems.some((startedTrigger) => startedTrigger.id === trigger.id),
      )

      if (notStartedTriggerItems.length) {
        await this.runnerService.runTriggerItemsFromRootAction(workflowRun, notStartedTriggerItems)
      } else if (!this.processInterrupted) {
        await this.workflowRunService.updateWorkflowRunStatus(
          workflowRun._id,
          success ? WorkflowRunStatus.completed : WorkflowRunStatus.failed,
        )
      }
    }
  }
}
