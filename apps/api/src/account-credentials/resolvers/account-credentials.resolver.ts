import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import {
  AccountCredential,
  CreateAccountCredentialInput,
  UpdateAccountCredentialInput,
} from '../entities/account-credential'
import { AccountCredentialService } from '../services/account-credentials.service'

@Resolver(() => AccountCredential)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(AccountCredential))
export class AccountCredentialResolver extends BaseResolver(AccountCredential, {
  CreateDTOClass: CreateAccountCredentialInput,
  UpdateDTOClass: UpdateAccountCredentialInput,
  guards: [GraphqlGuard],
}) {
  constructor(protected accountCredentialService: AccountCredentialService) {
    super(accountCredentialService)
  }
}
