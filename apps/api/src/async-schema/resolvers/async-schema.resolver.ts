import { IntegrationDefinitionFactory } from '@app/definitions'
import { Logger, NotFoundException, UseGuards } from '@nestjs/common'
import { Args, Field, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { OperationRunnerService } from 'apps/runner/src/services/operation-runner.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'
import { ObjectId } from 'mongoose'
import { UserId } from '../../auth/decorators/user-id.decorator'
import { OAuthStrategyFactory } from '../../auth/external-oauth/oauth-strategy.factory'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { IntegrationAction } from '../../integration-actions/entities/integration-action'
import { IntegrationActionService } from '../../integration-actions/services/integration-action.service'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { UserService } from '../../users/services/user.service'

@ObjectType('AsyncSchema')
export class AsyncSchemaDto {
  @Field((type) => GraphQLJSONObject)
  schemas: { [key: string]: JSONSchema7 }
}

@Resolver('AsyncSchema')
export class AsyncSchemaResolver {
  private readonly logger: Logger = new Logger(AsyncSchemaResolver.name)

  constructor(
    private readonly userService: UserService,
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly integrationActionService: IntegrationActionService,
    private readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
    private readonly runnerService: RunnerService,
    private readonly operationRunnerService: OperationRunnerService,
    private readonly oauthStrategyFactory: OAuthStrategyFactory,
  ) {}

  @Query(() => AsyncSchemaDto)
  @UseGuards(GraphqlGuard)
  async asyncSchemas(
    @UserId() userId: ObjectId,
    @Args({ name: 'integrationId', type: () => GraphQLString }) integrationId: string,
    @Args({ name: 'accountCredentialId', type: () => GraphQLString }) accountCredentialId: string,
    @Args({ name: 'names', type: () => [GraphQLString] }) names: string[],
    @Args({ name: 'inputs', type: () => GraphQLJSONObject, nullable: true }) inputs?: Record<string, any>,
    @Args({ name: 'integrationTriggerId', type: () => GraphQLString, nullable: true }) integrationTriggerId?: string,
    @Args({ name: 'integrationActionId', type: () => GraphQLString, nullable: true }) integrationActionId?: string,
  ): Promise<AsyncSchemaDto> {
    const user = await this.userService.findOne({ _id: userId })
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`)
    }

    const integration = await this.integrationService.findOne({
      _id: integrationId,
      owner: userId,
    })
    if (!integration) {
      throw new NotFoundException('Integration not found')
    }

    if (!integrationTriggerId && !integrationActionId) {
      throw new Error('Either integrationTriggerId or integrationActionId must be provided')
    }

    if (integrationTriggerId && integrationActionId) {
      throw new Error('integrationTriggerId and integrationActionId cannot be provided together')
    }

    // The operation can be either an integrationTrigger or an integrationAction
    let operation: IntegrationTrigger | IntegrationAction
    if (integrationTriggerId) {
      const integrationTrigger = await this.integrationTriggerService.findOne({
        _id: integrationTriggerId,
        integration: integrationId,
      })
      if (!integrationTrigger) {
        throw new NotFoundException(`IntegrationTrigger ${integrationTriggerId} not found`)
      }
      operation = integrationTrigger
    } else {
      const integrationAction = await this.integrationActionService.findOne({
        _id: integrationActionId,
        integration: integrationId,
      })
      if (!integrationAction) {
        throw new NotFoundException(`IntegrationAction ${integrationActionId} not found`)
      }
      operation = integrationAction
    }

    const { credentials, accountCredential, integrationAccount } =
      await this.runnerService.getCredentialsAndIntegrationAccount(accountCredentialId, userId.toString(), () => {
        throw new NotFoundException('Account credential not found')
      })

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)

    const props = {
      integration,
      integrationAccount,
      operation,
      inputs: inputs ?? {},
      credentials,
      accountCredential,
      operationRunnerService: this.operationRunnerService,
      user: {
        id: userId.toString(),
        address: user.address,
        email: user.email,
      },
    }

    const runWithRefreshCredentialsRetry = async <T>(cb: () => Promise<T>) => {
      try {
        return await cb()
      } catch (e) {
        if (integrationAccount) {
          // refresh credentials and try again
          props.credentials.accessToken = await this.oauthStrategyFactory.refreshOauth2AccessToken(
            integrationAccount.key,
            accountCredential,
            credentials,
          )
          try {
            return await cb()
          } catch (e) {
            this.logger.error(`Error while getting async schema for ${operation.key} on ${integration.key}`, e)
          }
        }
      }
    }

    const schemas: { [key: string]: JSONSchema7 } = {}
    const asyncSchemas = await definition.getAsyncSchemas(operation)
    for (const name of names) {
      if (asyncSchemas[name]) {
        const schema = await runWithRefreshCredentialsRetry(() => asyncSchemas[name](props))
        if (schema) {
          schemas[name] = schema
        }
      }
    }

    const additionalSchemas =
      (await runWithRefreshCredentialsRetry(() => definition.getAdditionalAsyncSchema(operation, props))) ?? {}

    return {
      schemas: {
        ...schemas,
        ...additionalSchemas,
      },
    }
  }
}
