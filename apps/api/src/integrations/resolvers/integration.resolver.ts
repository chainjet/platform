import { BaseResolver, SearchableQueryArgsType } from '@app/common/base/base.resolver'
import { NotOwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Injectable } from '@nestjs/common'
import { Args, ArgsType, Query, Resolver } from '@nestjs/graphql'
import { CursorConnectionType, QueryArgsType } from '@ptc-org/nestjs-query-graphql'
import { GraphQLString } from 'graphql'
import { Integration } from '../entities/integration'
import { integrationCategories, IntegrationCategory } from '../entities/integration-categories'
import { IntegrationService } from '../services/integration.service'

// TODO set default filter to deprecated: false

@Injectable()
export class IntegrationAuthorizer extends NotOwnedAuthorizer<Integration> {}

@ArgsType()
export class IntegrationQuery extends SearchableQueryArgsType(Integration) {}

@Resolver(() => Integration)
export class IntegrationResolver extends BaseResolver(Integration, {
  read: {
    maxResultsSize: 120,
  },
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true },
}) {
  constructor(protected readonly integrationService: IntegrationService) {
    super(integrationService)
  }

  /**
   * This override makes integrations searchable
   */
  @Query(() => QueryArgsType(Integration).ConnectionType)
  integrations(@Args() query: IntegrationQuery): Promise<CursorConnectionType<Integration>> {
    return super.queryMany(query)
  }

  @Query(() => [IntegrationCategory])
  integrationCategories(): IntegrationCategory[] {
    return integrationCategories
  }

  @Query(() => IntegrationCategory, { nullable: true })
  integrationCategory(@Args('id', { type: () => GraphQLString }) id: string): IntegrationCategory | null {
    return integrationCategories.find((category) => category.id === id) ?? null
  }
}
