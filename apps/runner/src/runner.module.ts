import { CommonModule } from '@app/common'
import { redisForRoot } from '@app/common/utils/redis.utils'
import { DefinitionsModule } from '@app/definitions'
import { BlockchainModule } from '@blockchain/blockchain'
import { forwardRef, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from 'apps/api/src/users/users.module'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { AccountCredentialsModule } from '../../api/src/account-credentials/account-credentials.module'
import { AuthModule } from '../../api/src/auth/auth.module'
import { IntegrationAccountsModule } from '../../api/src/integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from '../../api/src/integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../../api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../../api/src/integrations/integrations.module'
import { WorkflowActionsModule } from '../../api/src/workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from '../../api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from '../../api/src/workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../../api/src/workflows/workflows.module'
import { EvmRunnerService } from './services/evm-runner.service'
import { OperationRunnerService } from './services/operation-runner.service'
import { RunnerService } from './services/runner.service'
import { StaticRunner } from './services/static-runner.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    mongoForRoot(),
    redisForRoot(),
    CommonModule,
    UsersModule,
    IntegrationsModule,
    IntegrationAccountsModule,
    IntegrationActionsModule,
    IntegrationTriggersModule,

    // TODO remove forwardRef once Runner calls are replaced with queues
    forwardRef(() => WorkflowsModule),
    forwardRef(() => WorkflowActionsModule),
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowRunsModule),

    forwardRef(() => AccountCredentialsModule),
    AuthModule,
    DefinitionsModule,
    BlockchainModule,
  ],
  providers: [RunnerService, OperationRunnerService, StaticRunner, EvmRunnerService],
  exports: [RunnerService, OperationRunnerService, StaticRunner],
})
export class RunnerModule {}
