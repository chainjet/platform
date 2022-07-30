import { BaseResolver, SearchableQueryArgsType } from '@app/common/base/base.resolver'
import { ConnectionType, CursorConnectionType } from '@nestjs-query/query-graphql'
import { Args, ArgsType, Query, Resolver } from '@nestjs/graphql'
import { GraphQLString } from 'graphql'
import { Integration } from '../entities/integration'
import { integrationCategories, IntegrationCategory } from '../entities/integration-categories'
import { IntegrationService } from '../services/integration.service'

// TODO set default filter to deprecated: false

@ArgsType()
export class IntegrationQuery extends SearchableQueryArgsType(Integration) {}

@Resolver(() => Integration)
export class IntegrationResolver extends BaseResolver(Integration, {
  read: {
    maxResultsSize: 120
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true }
}) {
  constructor (protected readonly integrationService: IntegrationService) {
    super(integrationService)
  }

  /**
   * This override makes integrations searchable
   */
  @Query(() => ConnectionType(Integration, {}))
  integrations (@Args() query: IntegrationQuery): Promise<CursorConnectionType<Integration>> {
    return super.queryMany(query)
  }

  @Query(() => [IntegrationCategory])
  integrationCategories (): IntegrationCategory[] {
    return integrationCategories
  }

  @Query(() => IntegrationCategory, { nullable: true })
  integrationCategory (@Args('id', { type: () => GraphQLString }) id: string): IntegrationCategory | null {
    return integrationCategories.find(category => category.id === id) ?? null
  }
}
