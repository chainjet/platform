import { Injectable, Logger } from '@nestjs/common'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { WorkflowRunStatus } from 'generated/graphql'

@Injectable()
export class PlatformMetricsService {
  private readonly logger = new Logger(PlatformMetricsService.name)

  constructor(
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowRunService: WorkflowRunService,
  ) {}

  async onModuleInit() {
    await this.getActiveWorkflows()
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
}
