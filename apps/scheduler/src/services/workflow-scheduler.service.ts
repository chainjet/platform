import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowRunStartedByOptions } from '../../../api/src/workflow-runs/entities/workflow-run-started-by-options'
import { WorkflowSleepService } from '../../../api/src/workflow-runs/services/workflow-sleep.service'
import { WorkflowTriggerService } from '../../../api/src/workflow-triggers/services/workflow-trigger.service'
import { RunnerService } from '../../../runner/src/services/runner.service'

@Injectable()
export class WorkflowSchedulerService {
  private readonly logger = new Logger(WorkflowSchedulerService.name)

  constructor(
    private readonly runnerService: RunnerService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowSleepService: WorkflowSleepService,
  ) {}

  @Interval(10 * 1000)
  async scheduleTriggerChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      await this.scheduleTriggerChecks()
    }
  }

  @Interval(10 * 1000)
  async scheduleSleepChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      await this.scheduleSleepChecks()
    }
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
      sleepUntil: {
        $lt: new Date(),
      },
    })

    // TODO use a queue
    const promises = workflowSleeps.map((workflowSleep) => this.runnerService.wakeUpWorkflowRun(workflowSleep))
    await Promise.all(promises)
  }
}
