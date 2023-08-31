import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { ChatsModule } from '../chat/chat.module'
import { CompilerModule } from '../compiler/compiler.module'
import { IntegrationActionsModule } from '../integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { WorkflowTriggersModule } from '../workflow-triggers/workflow-triggers.module'
import { Workflow, WorkflowAuthorizer } from './entities/workflow'
import { WorkflowResolver } from './resolvers/workflow.resolver'
import { WorkflowService } from './services/workflow.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Workflow])],
      dtos: [{ DTOClass: Workflow }],
    }),
    AuthModule, // required for GraphqlGuard
    UsersModule, // required for GraphqlGuard
    IntegrationsModule,
    IntegrationTriggersModule,
    IntegrationActionsModule,
    forwardRef(() => CompilerModule),
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => WorkflowActionsModule),
    forwardRef(() => AccountCredentialsModule),
    forwardRef(() => ChatsModule),
  ],
  providers: [WorkflowResolver, WorkflowService, WorkflowAuthorizer],
  exports: [WorkflowService],
})
export class WorkflowsModule {}
