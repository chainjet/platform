import { BaseResolver, SearchableQueryArgsType } from '@app/common/base/base.resolver'
import { Args, ArgsType, Query, Resolver } from '@nestjs/graphql'
import { CursorConnectionType, QueryArgsType } from '@ptc-org/nestjs-query-graphql'
import { IntegrationTrigger } from '../entities/integration-trigger'
import { IntegrationTriggerService } from '../services/integration-trigger.service'

@ArgsType()
export class IntegrationTriggerQuery extends SearchableQueryArgsType(IntegrationTrigger) {}

@Resolver(() => IntegrationTrigger)
export class IntegrationTriggerResolver extends BaseResolver(IntegrationTrigger, {
  read: {
    maxResultsSize: 120,
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
}) {
  constructor(protected integrationTriggerService: IntegrationTriggerService) {
    super(integrationTriggerService)
  }

  /**
   * This override makes integration triggers searchable
   */
  @Query(() => QueryArgsType(IntegrationTrigger).ConnectionType)
  integrationTriggers(@Args() query: IntegrationTriggerQuery): Promise<CursorConnectionType<IntegrationTrigger>> {
    return super.queryMany(query)
  }
}
