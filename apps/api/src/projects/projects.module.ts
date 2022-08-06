import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { forwardRef, Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { UsersModule } from '../users/users.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { Project } from './entities/project'
import { ProjectAuthorizer, ProjectResolver } from './resolvers/project.resolver'
import { ProjectService } from './services/project.service'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([Project])],
      dtos: [{ DTOClass: Project }],
    }),
    UsersModule,
    forwardRef(() => WorkflowsModule),
  ],
  providers: [ProjectResolver, ProjectService, ProjectAuthorizer],
  exports: [ProjectService],
})
export class ProjectsModule {}
