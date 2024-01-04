import { bullForRoot, redisForRoot } from '@app/common/utils/redis.utils'
import { BlockchainModule } from '@blockchain/blockchain'
import { BullModule } from '@nestjs/bull'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountCredentialsModule } from 'apps/api/src/account-credentials/account-credentials.module'
import { ChatsModule } from 'apps/api/src/chat/chat.module'
import { BroadcastConsumer } from 'apps/api/src/chat/services/broadcast.consumer'
import { IntegrationAccountsModule } from 'apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationTriggersModule } from 'apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from 'apps/api/src/integrations/integrations.module'
import { UsersModule } from 'apps/api/src/users/users.module'
import { WorkflowActionsModule } from 'apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowsModule } from 'apps/api/src/workflows/workflows.module'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { WorkflowRunsModule } from '../../api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from '../../api/src/workflow-triggers/workflow-triggers.module'
import { RunnerModule } from '../../runner/src/runner.module'
import { AccountRefreshSchedulerService } from './services/account-refresh-scheduler.service'
import { CampaignSchedulerService } from './services/campaign-scheduler.service'
import { WorkflowSchedulerService } from './services/workflow-scheduler.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    mongoForRoot(),
    redisForRoot(),
    bullForRoot(),
    BullModule.registerQueue({
      name: 'broadcast',
      settings: {
        lockDuration: 60000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
    }),
    ScheduleModule.forRoot(),
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowRunsModule),
    forwardRef(() => RunnerModule),
    UsersModule,
    BlockchainModule,
    IntegrationsModule,
    IntegrationTriggersModule,
    WorkflowActionsModule,
    WorkflowsModule,
    IntegrationAccountsModule,
    AccountCredentialsModule,
    ChatsModule,
  ],
  providers: [WorkflowSchedulerService, AccountRefreshSchedulerService, CampaignSchedulerService, BroadcastConsumer],
})
export class SchedulerModule {}
