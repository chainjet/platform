import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { ProjectsModule } from '../projects/projects.module'
import { UsersModule } from '../users/users.module'
import { Workflow } from './entities/workflow'
import { WorkflowAuthorizer, WorkflowResolver } from './resolvers/workflow.resolver'
import { WorkflowService } from './services/workflow.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Workflow])],
      dtos: [{ DTOClass: Workflow }],
    }),
    UsersModule, // required for GraphqlGuard
    forwardRef(() => ProjectsModule),
  ],
  providers: [WorkflowResolver, WorkflowService, WorkflowAuthorizer],
  exports: [WorkflowService],
})
export class WorkflowsModule {}
