import { mongoForRoot } from '@app/common/utils/mongodb'
import { redisForRoot } from '@app/common/utils/redis.utils'
import { BlockchainModule } from '@blockchain/blockchain'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountCredentialsModule } from 'apps/api/src/account-credentials/account-credentials.module'
import { IntegrationTriggersModule } from 'apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from 'apps/api/src/integrations/integrations.module'
import { UsersModule } from 'apps/api/src/users/users.module'
import { WorkflowActionsModule } from 'apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from 'apps/api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from 'apps/api/src/workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from 'apps/api/src/workflows/workflows.module'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { BlockchainListenerService } from './blockchain-listener.service'
import { XmtpListenerService } from './xmtp-listener.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    mongoForRoot(),
    redisForRoot(),
    ScheduleModule.forRoot(),
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowRunsModule),
    forwardRef(() => RunnerModule),
    BlockchainModule,
    IntegrationsModule,
    IntegrationTriggersModule,
    WorkflowActionsModule,
    WorkflowsModule,
    AccountCredentialsModule,
    UsersModule,
  ],
  providers: [BlockchainListenerService, XmtpListenerService],
})
export class BlockchainListenerModule {}
