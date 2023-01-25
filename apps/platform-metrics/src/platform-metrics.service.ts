import { UserEventKey } from '@app/common/metrics/entities/user-event'
import { UserEventService } from '@app/common/metrics/user-event.service'
import { Injectable, Logger } from '@nestjs/common'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { Workflow } from 'apps/api/src/workflows/entities/workflow'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { WorkflowRunStatus } from 'generated/graphql'

@Injectable()
export class PlatformMetricsService {
  private readonly logger = new Logger(PlatformMetricsService.name)

  constructor(
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly workflowService: WorkflowService,
    private readonly userEventService: UserEventService,
  ) {}

  async onModuleInit() {
    await this.getActiveUsers()
  }

  async getActiveWorkflows(): Promise<number> {
    const workflowTriggers = await this.workflowTriggerService.find({ enabled: true })
    this.logger.log(`There are ${workflowTriggers.length} workflow triggers`)
    let activeWorkflows = 0
    for (const workflowTrigger of workflowTriggers) {
      const workflowId = workflowTrigger.workflow.toString()
      const lastSuccessfulRun = await this.workflowRunService.findOne(
        { status: WorkflowRunStatus.completed, workflow: workflowId },
        {},
        { sort: { _id: -1 } },
      )
      if (
        lastSuccessfulRun?.createdAt &&
        lastSuccessfulRun.createdAt > new Date(new Date().setMonth(new Date().getMonth() - 1))
      ) {
        activeWorkflows++
      }
    }
    this.logger.log(`There are ${activeWorkflows} active workflows`)
    return activeWorkflows
  }

  async getWorkflowRunsPerDay() {
    const workflowsPerDay = await this.workflowRunService.aggregateNative([
      {
        $group: {
          _id: {
            dateYMD: {
              $dateFromParts: {
                year: { $year: '$_id' },
                month: { $month: '$_id' },
                day: { $dayOfMonth: '$_id' },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.dateYMD': -1 },
      },
      {
        $project: {
          _id: 0,
          count: 1,
          dateDMY: { $dateToString: { date: '$_id.dateYMD', format: '%d-%m-%Y' } },
        },
      },
    ])
    console.log(`workflowsPerDay`, workflowsPerDay)
  }

  async getActiveUsers(trailingDays: number = 30) {
    const events = await this.userEventService.find({ key: UserEventKey.OPERATION_SUCCEDED })
    const sortedEvents = events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const lastEventDate = new Date(sortedEvents[sortedEvents.length - 1].date)
    const iteratorDate = new Date(sortedEvents[0].date)
    while (iteratorDate <= lastEventDate) {
      const trailingDate = new Date(iteratorDate.getTime())
      trailingDate.setDate(trailingDate.getDate() - trailingDays)

      const eventsTrailing = sortedEvents.filter(
        (e) => new Date(e.date) >= trailingDate && new Date(e.date) <= iteratorDate,
      )
      const uniqueUsers = eventsTrailing.reduce((acc: string[], curr) => {
        if (!acc.includes(curr.user._id.toString())) {
          acc.push(curr.user._id.toString())
        }
        return acc
      }, [])
      console.log(`${iteratorDate.toISOString().split('T')[0]}: ${uniqueUsers.length}`)

      iteratorDate.setDate(iteratorDate.getDate() + 1)
    }
  }

  async countTemplatesUses() {
    const dashboards = await this.workflowService.find({ isListed: true })
    const dashboardUses = new Map<Workflow, number>()
    for (const dashboard of dashboards) {
      const workflows = await this.workflowService.find({ forkOf: dashboard._id })
      const workflowTriggers = await this.workflowTriggerService.find({
        workflow: { $in: workflows.map((w) => w._id) },
        enabled: true,
      })
      dashboardUses.set(dashboard, workflowTriggers.length)
    }
    const sortedDashboardUses = new Map([...dashboardUses.entries()].sort((a, b) => b[1] - a[1]))
    for (const [dashboard, uses] of sortedDashboardUses.entries()) {
      console.log(`**${dashboard.name}** has been used ${uses} times`)
    }
  }
}
