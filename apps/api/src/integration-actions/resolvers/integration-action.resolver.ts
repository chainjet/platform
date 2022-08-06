import { BaseResolver, SearchableQueryArgsType } from '@app/common/base/base.resolver'
import { Args, ArgsType, Query, Resolver } from '@nestjs/graphql'
import { CursorConnectionType, QueryArgsType } from '@ptc-org/nestjs-query-graphql'
import { IntegrationAction } from '../entities/integration-action'
import { IntegrationActionService } from '../services/integration-action.service'

@ArgsType()
export class IntegrationActionQuery extends SearchableQueryArgsType(IntegrationAction) {}

@Resolver(() => IntegrationAction)
export class IntegrationActionResolver extends BaseResolver(IntegrationAction, {
  read: {
    maxResultsSize: 120,
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
}) {
  constructor(protected integrationActionService: IntegrationActionService) {
    super(integrationActionService)
  }

  /**
   * This override makes integration actions searchable
   */
  @Query(() => QueryArgsType(IntegrationAction).ConnectionType)
  integrationActions(@Args() query: IntegrationActionQuery): Promise<CursorConnectionType<IntegrationAction>> {
    return super.queryMany(query)
  }
}
