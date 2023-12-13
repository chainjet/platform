import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { Assistant, CreateAssistantInput, UpdateAssistantInput } from '../entities/assistant'
import { AssistantService } from '../services/assistant.service'

@Resolver(() => Assistant)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Assistant))
export class AssistantResolver extends BaseResolver(Assistant, {
  CreateDTOClass: CreateAssistantInput,
  UpdateDTOClass: UpdateAssistantInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected assistantService: AssistantService,
    @InjectAuthorizer(Assistant) readonly authorizer: Authorizer<Assistant>,
  ) {
    super(assistantService)
  }
}
