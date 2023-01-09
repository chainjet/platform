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

  async getActiveUsers() {
    // request to get the number of active users per day trailing 7 days
    const resPerDay = await this.workflowRunService.aggregateNative([
      // Group the workflow runs by user and week, and count the number of workflow runs per group
      {
        $group: {
          _id: {
            user: '$owner',
            week: {
              $isoWeek: '$_id',
            },
          },
          count: { $sum: 1 },
        },
      },
      // Only include groups that have more than 0 workflow runs
      {
        $match: {
          count: { $gt: 0 },
        },
      },
      // Group the results by week and count the number of active users per week
      {
        $group: {
          _id: '$_id.week',
          activeUsers: { $sum: 1 },
        },
      },
      // Sort the results in descending order by week
      {
        $sort: {
          _id: -1,
        },
      },
    ])

    for (const res of resPerDay) {
      console.log(`There were ${res.activeUsers} active users in week ${res._id}`)
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
