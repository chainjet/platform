import { BaseResolver } from '@app/common/base/base.resolver'
import { Resolver } from '@nestjs/graphql'
import { IntegrationAccount } from '../entities/integration-account'
import { IntegrationAccountService } from '../services/integration-account.service'

@Resolver(() => IntegrationAccount)
export class IntegrationAccountResolver extends BaseResolver(IntegrationAccount, {
  create: { disabled: true },
  update: { disabled: true },
  delete: { disabled: true }
}) {
  constructor (protected integrationAccountService: IntegrationAccountService) {
    super(integrationAccountService)
  }
}
