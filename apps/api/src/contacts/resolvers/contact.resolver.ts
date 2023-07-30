import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { Contact } from '../entities/contact'
import { ContactService } from '../services/contact.service'

@Resolver(() => Contact)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Contact))
export class ContactResolver extends BaseResolver(Contact, {
  // CreateDTOClass: CreateUserDatabaseInput,
  // UpdateDTOClass: UpdateUserDatabaseInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected contactService: ContactService,
    @InjectAuthorizer(Contact) readonly authorizer: Authorizer<Contact>,
  ) {
    super(contactService)
  }
}
