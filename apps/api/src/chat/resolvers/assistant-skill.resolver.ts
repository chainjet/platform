import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { AssistantSkill, CreateAssistantSkillInput, UpdateAssistantSkillInput } from '../entities/assistant-skill'
import { AssistantSkillService } from '../services/assistant-skill.service'

@Resolver(() => AssistantSkill)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(AssistantSkill))
export class AssistantSkillResolver extends BaseResolver(AssistantSkill, {
  CreateDTOClass: CreateAssistantSkillInput,
  UpdateDTOClass: UpdateAssistantSkillInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected assistantSkillService: AssistantSkillService,
    @InjectAuthorizer(AssistantSkill) readonly authorizer: Authorizer<AssistantSkill>,
  ) {
    super(assistantSkillService)
  }
}
