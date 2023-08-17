import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { Campaign, CreateCampaignInput, UpdateCampaignInput } from '../entities/campaign'
import { CampaignService } from '../services/campaign.service'

@Resolver(() => Campaign)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Campaign))
export class CampaignResolver extends BaseResolver(Campaign, {
  CreateDTOClass: CreateCampaignInput,
  UpdateDTOClass: UpdateCampaignInput,
  guards: [GraphqlGuard],
  enableTotalCount: true,
}) {
  constructor(
    protected campaignService: CampaignService,
    @InjectAuthorizer(Campaign) readonly authorizer: Authorizer<Campaign>,
  ) {
    super(campaignService)
  }
}
