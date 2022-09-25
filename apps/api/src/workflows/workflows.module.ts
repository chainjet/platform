import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
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
  ],
  providers: [WorkflowResolver, WorkflowService, WorkflowAuthorizer],
  exports: [WorkflowService],
})
export class WorkflowsModule {}
