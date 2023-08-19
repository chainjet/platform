import { CommonModule } from '@app/common'
import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { DefinitionsModule } from '../../../../libs/definitions/src'
import { RunnerModule } from '../../../runner/src/runner.module'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { ChatsModule } from '../chat/chat.module'
import { IntegrationAccountsModule } from '../integration-accounts/integration-accounts.module'
import { IntegrationTriggersModule } from '../integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from '../workflow-runs/workflow-runs.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { ChainJetBotController } from './controllers/chainjetbot.controller'
import { ChatbotController } from './controllers/chatbot.controller'
import { HooksController } from './controllers/hooks.controller'
import { WorkflowTrigger, WorkflowTriggerAuthorizer } from './entities/workflow-trigger'
import { WorkflowUsedId } from './entities/workflow-used-id'
import { WorkflowTriggerResolver } from './resolvers/workflow-trigger.resolver'
import { WorkflowTriggerService } from './services/workflow-trigger.service'
import { WorkflowUsedIdService } from './services/workflow-used-id.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([WorkflowTrigger]),
        NestjsQueryTypegooseModule.forFeature([WorkflowUsedId]),
      ],
      dtos: [{ DTOClass: WorkflowTrigger }, { DTOClass: WorkflowUsedId }],
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    IntegrationsModule,
    IntegrationAccountsModule,
    IntegrationTriggersModule,
    forwardRef(() => AccountCredentialsModule),
    forwardRef(() => WorkflowsModule),
    forwardRef(() => WorkflowActionsModule),
    forwardRef(() => WorkflowRunsModule),
    DefinitionsModule,

    // TODO remove forwardRef once Runner calls are replaced with queues
    forwardRef(() => RunnerModule),
    ChatsModule,
  ],
  providers: [WorkflowTriggerResolver, WorkflowTriggerService, WorkflowTriggerAuthorizer, WorkflowUsedIdService],
  exports: [WorkflowTriggerService, WorkflowUsedIdService],
  controllers: [HooksController, ChainJetBotController, ChatbotController],
})
export class WorkflowTriggersModule {}
