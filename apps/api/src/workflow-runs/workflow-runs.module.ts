import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypegooseModule } from '../../../../libs/common/src/NestjsQueryTypegooseModule'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { WorkflowTriggersModule } from '../workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { WorkflowRun } from './entities/workflow-run'
import { WorkflowRunAction } from './entities/workflow-run-action'
import { WorkflowRunTrigger } from './entities/workflow-run-trigger'
import { WorkflowSleep } from './entities/workflow-sleep'
import { WorkflowRunAuthorizer, WorkflowRunResolver } from './resolvers/workflow-run.resolver'
import { WorkflowRunService } from './services/workflow-run.service'
import { WorkflowSleepService } from './services/workflow-sleep.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypegooseModule.forFeature([WorkflowRun, WorkflowRunTrigger, WorkflowRunAction, WorkflowSleep]),
      ],
      resolvers: [
        {
          DTOClass: WorkflowRunTrigger,
          EntityClass: WorkflowRunTrigger,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
        },
        {
          DTOClass: WorkflowRunAction,
          EntityClass: WorkflowRunAction,
          create: { disabled: true },
          update: { disabled: true },
          delete: { disabled: true },
        },
      ],
      dtos: [{ DTOClass: WorkflowRun }, { DTOClass: WorkflowSleep }],
    }),
    AuthModule, // required for GraphqlGuard
    UsersModule,
    WorkflowsModule,
    forwardRef(() => WorkflowTriggersModule),
  ],
  providers: [WorkflowRunService, WorkflowRunResolver, WorkflowRunAuthorizer, WorkflowSleepService],
  exports: [WorkflowRunService, WorkflowSleepService],
})
export class WorkflowRunsModule {}
