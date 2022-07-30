import { BaseResolver } from '@app/common/base/base.resolver'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateProjectInput, Project, UpdateProjectInput } from '../entities/project'
import { ProjectService } from '../services/project.service'

@Injectable()
export class ProjectAuthorizer extends OwnedAuthorizer<Project> {}

@Resolver(() => Project)
@UseGuards(GraphqlGuard)
export class ProjectResolver extends BaseResolver(Project, {
  CreateDTOClass: CreateProjectInput,
  UpdateDTOClass: UpdateProjectInput,
  guards: [GraphqlGuard]
  // read: {},
  // create: { guards: [GraphqlGuard] },
  // update: { guards: [] },
  // delete: { guards: [], },
}) {
  constructor (
    protected projectService: ProjectService,
    @InjectAuthorizer(Project) readonly authorizer: Authorizer<Project>
    // @InjectPubSub() readonly pubSub: PubSub,
  ) {
    super(projectService)
  }
}
