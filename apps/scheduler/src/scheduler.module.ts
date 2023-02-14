import { BlockchainModule } from '@blockchain/blockchain'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { IntegrationTriggersModule } from 'apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from 'apps/api/src/integrations/integrations.module'
import { WorkflowActionsModule } from 'apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowsModule } from 'apps/api/src/workflows/workflows.module'
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
    forwardRef(() => RunnerModule),
    BlockchainModule,
    IntegrationsModule,
    IntegrationTriggersModule,
    WorkflowActionsModule,
    WorkflowsModule,
  ],
  providers: [WorkflowSchedulerService],
})
export class SchedulerModule {}
