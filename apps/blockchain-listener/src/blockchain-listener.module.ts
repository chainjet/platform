import { mongoForRoot } from '@app/common/utils/mongodb'
import { redisForRoot } from '@app/common/utils/redis.utils'
import { BlockchainModule } from '@blockchain/blockchain'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { AccountCredentialsModule } from 'apps/api/src/account-credentials/account-credentials.module'
import { IntegrationAccountsModule } from 'apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationTriggersModule } from 'apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from 'apps/api/src/integrations/integrations.module'
import { UserDatabaseModule } from 'apps/api/src/user-database/user-database.module'
import { UsersModule } from 'apps/api/src/users/users.module'
import { WorkflowActionsModule } from 'apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from 'apps/api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from 'apps/api/src/workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from 'apps/api/src/workflows/workflows.module'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { BlockchainListenerService } from './blockchain-listener.service'
import { ChatbotListenerService } from './chatbot-listener.service'
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
    IntegrationAccountsModule,
    WorkflowActionsModule,
    WorkflowsModule,
    AccountCredentialsModule,
    UsersModule,
    UserDatabaseModule,
  ],
  providers: [BlockchainListenerService, XmtpListenerService, ChatbotListenerService],
})
export class BlockchainListenerModule {}
