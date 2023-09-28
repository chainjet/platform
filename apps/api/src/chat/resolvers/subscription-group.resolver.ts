import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import {
  CreateSubscriptionGroupInput,
  SubscriptionGroup,
  UpdateSubscriptionGroupInput,
} from '../entities/subscription-group'
import { SubscriptionGroupService } from '../services/subscription-group.service'

@Resolver(() => SubscriptionGroup)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(SubscriptionGroup))
export class SubscriptionGroupResolver extends BaseResolver(SubscriptionGroup, {
  CreateDTOClass: CreateSubscriptionGroupInput,
  UpdateDTOClass: UpdateSubscriptionGroupInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected subscriptionGroupService: SubscriptionGroupService,
    @InjectAuthorizer(SubscriptionGroup) readonly authorizer: Authorizer<SubscriptionGroup>,
  ) {
    super(subscriptionGroupService)
  }
}
