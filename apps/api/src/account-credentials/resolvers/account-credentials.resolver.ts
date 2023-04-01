import { BaseResolver } from '@app/common/base/base.resolver'
import { IntegrationDefinitionFactory } from '@app/definitions'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Args, Field, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { AuthorizerInterceptor } from '@ptc-org/nestjs-query-graphql'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import {
  AccountCredential,
  CreateAccountCredentialInput,
  UpdateAccountCredentialInput,
} from '../entities/account-credential'
import { AccountCredentialService } from '../services/account-credentials.service'

@ObjectType()
export class ConnectAccountDataPayload {
  @Field(() => GraphQLJSONObject)
  data: Record<string, any>
}

@Resolver(() => AccountCredential)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(AccountCredential))
export class AccountCredentialResolver extends BaseResolver(AccountCredential, {
  CreateDTOClass: CreateAccountCredentialInput,
  UpdateDTOClass: UpdateAccountCredentialInput,
  guards: [GraphqlGuard],
}) {
  constructor(
    protected accountCredentialService: AccountCredentialService,
    protected readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {
    super(accountCredentialService)
  }

  /**
   * Integrations might require additional data to connect an account. This endpoint returns that data.
   */
  @Query(() => ConnectAccountDataPayload)
  async accountCreationData(@UserId() userId: string, @Args({ name: 'key', type: () => GraphQLString }) key: string) {
    const definition = this.integrationDefinitionFactory.getDefinition(key)
    if (!definition) {
      throw new Error(`No definition found for key ${key}`)
    }
    return {
      data: await definition.getAccountCreationData(userId),
    }
  }
}
