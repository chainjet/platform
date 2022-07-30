import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { NestjsQueryGraphQLModule } from '@nestjs-query/query-graphql'
import { forwardRef, Module } from '@nestjs/common'
import { UsersModule } from '../users/users.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { Project } from './entities/project'
import { ProjectAuthorizer, ProjectResolver } from './resolvers/project.resolver'
import { ProjectService } from './services/project.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Project])],
      resolvers: []
    }),
    UsersModule,
    forwardRef(() => WorkflowsModule)
  ],
  providers: [ProjectResolver, ProjectService, ProjectAuthorizer],
  exports: [ProjectService]
})
export class ProjectsModule {}
