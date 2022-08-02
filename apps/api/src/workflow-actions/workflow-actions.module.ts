import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { forwardRef, Module } from '@nestjs/common'
import { DefinitionsModule } from '../../../../libs/definitions/src/definitions.module'
import { AccountCredentialsModule } from '../account-credentials/account-credentials.module'
import { AuthModule } from '../auth/auth.module'
import { IntegrationActionsModule } from '../integration-actions/integration-actions.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { UsersModule } from '../users/users.module'
import { WorkflowTriggersModule } from '../workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { WorkflowAction } from './entities/workflow-action'
import { WorkflowNextAction } from './entities/workflow-next-action'
import { WorkflowActionAuthorizer, WorkflowActionResolver } from './resolvers/workflow-action.resolver'
import { WorkflowActionService } from './services/workflow-action.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([WorkflowAction, WorkflowNextAction])],
      resolvers: [
        {
          DTOClass: WorkflowNextAction,
          EntityClass: WorkflowNextAction,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
        },
      ],
    }),
    UsersModule, // required for GraphqlGuard
    AuthModule,
    IntegrationsModule,
    IntegrationActionsModule,
    WorkflowsModule,
    forwardRef(() => WorkflowTriggersModule),
    forwardRef(() => AccountCredentialsModule),
    DefinitionsModule,
  ],
  providers: [WorkflowActionResolver, WorkflowActionService, WorkflowActionAuthorizer],
  exports: [WorkflowActionService],
})
export class WorkflowActionsModule {}
