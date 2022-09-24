import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AccountCredentialsModule } from '../../../apps/api/src/account-credentials/account-credentials.module'
import { AuthModule } from '../../../apps/api/src/auth/auth.module'
import { IntegrationAccountsModule } from '../../../apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from '../../../apps/api/src/integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../../../apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../../../apps/api/src/integrations/integrations.module'
import { UsersModule } from '../../../apps/api/src/users/users.module'
import { WorkflowActionsModule } from '../../../apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from '../../../apps/api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from '../../../apps/api/src/workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../../../apps/api/src/workflows/workflows.module'
import { RunnerModule } from '../../../apps/runner/src/runner.module'
import { DefinitionsModule } from '../../definitions/src'
import { EmailsModule } from '../../emails/src'
import { TestDatabaseModule } from './database/test-database.module'
import { MockService } from './mock.service'

const moduleList = [
  ConfigModule,
  HttpModule,
  TestDatabaseModule,
  AuthModule,
  UsersModule,
  IntegrationsModule,
  IntegrationAccountsModule,
  IntegrationTriggersModule,
  IntegrationActionsModule,
  WorkflowsModule,
  AccountCredentialsModule,
  WorkflowTriggersModule,
  WorkflowActionsModule,
  WorkflowRunsModule,
  DefinitionsModule,
  RunnerModule,
  EmailsModule,
]

@Module({
  imports: moduleList,
  exports: moduleList,
  providers: [MockService],
})
export class MockModule {}
