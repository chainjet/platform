import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { WorkflowRunsModule } from '../../api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from '../../api/src/workflow-triggers/workflow-triggers.module'
import { RunnerModule } from '../../runner/src/runner.module'
import { WorkflowSchedulerService } from './services/workflow-scheduler.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    mongoForRoot(),
    ScheduleModule.forRoot(),
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowRunsModule),
    RunnerModule
  ],
  providers: [WorkflowSchedulerService]
})
export class SchedulerModule {}
