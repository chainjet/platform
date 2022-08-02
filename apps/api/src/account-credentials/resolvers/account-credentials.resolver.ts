import { BaseResolver } from '@app/common/base/base.resolver'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Authorizer, InjectAuthorizer } from '@nestjs-query/query-graphql'
import { Injectable, UseGuards } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import {
  AccountCredential,
  CreateAccountCredentialInput,
  UpdateAccountCredentialInput,
} from '../entities/account-credential'
import { AccountCredentialService } from '../services/account-credentials.service'

@Injectable()
export class AccountCredentialAuthorizer extends OwnedAuthorizer<AccountCredential> {}

@Resolver(() => AccountCredential)
@UseGuards(GraphqlGuard)
export class AccountCredentialResolver extends BaseResolver(AccountCredential, {
  CreateDTOClass: CreateAccountCredentialInput,
  UpdateDTOClass: UpdateAccountCredentialInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected accountCredentialService: AccountCredentialService,
    @InjectAuthorizer(AccountCredential) readonly authorizer: Authorizer<AccountCredential>,
  ) {
    super(accountCredentialService)
  }
}
