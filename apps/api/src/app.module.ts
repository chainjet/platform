import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLModule } from '@nestjs/graphql'
import path from 'path'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { AccountCredentialsModule } from './account-credentials/account-credentials.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AsyncSchemaModule } from './async-schema/async-schema.module'
import { AuthModule } from './auth/auth.module'
import { CompilerModule } from './compiler/compiler.module'
import { ContractsModule } from './contracts/contracts.module'
import { IntegrationAccountsModule } from './integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from './integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from './integration-triggers/integration-triggers.module'
import { IntegrationsModule } from './integrations/integrations.module'
import { UsersModule } from './users/users.module'
import { WorkflowActionsModule } from './workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from './workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from './workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from './workflows/workflows.module'
import { TemplatesModule } from './templates/templates.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    mongoForRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      context: ({ req }) => ({ req }),
      autoSchemaFile: path.join(process.cwd(), 'generated/schema.graphql'),
      definitions: {
        path: path.join(process.cwd(), 'generated/graphql.ts'),
        // emitTypenameField: true,
      },
    }),
    AuthModule,
    UsersModule,
    IntegrationsModule,
    IntegrationAccountsModule,
    IntegrationActionsModule,
    IntegrationTriggersModule,
    WorkflowsModule,
    WorkflowActionsModule,
    AccountCredentialsModule,
    WorkflowTriggersModule,
    WorkflowRunsModule,
    ContractsModule,
    AsyncSchemaModule,
    CompilerModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
