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
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { IntegrationService } from '../../integrations/services/integration.service'

@ObjectType('AsyncSchema')
export class AsyncSchemaDto {
  @Field((type) => GraphQLJSONObject)
  schemas: { [key: string]: JSONSchema7 }
}

@Resolver('AsyncSchema')
export class AsyncSchemaResolver {
  private readonly logger: Logger = new Logger(AsyncSchemaResolver.name)

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
    private readonly runnerService: RunnerService,
    private readonly operationRunnerService: OperationRunnerService,
  ) {}

  @Query(() => AsyncSchemaDto)
  @UseGuards(GraphqlGuard)
  async asyncSchemas(
    @UserId() userId: ObjectId,
    @Args({ name: 'integrationId', type: () => GraphQLString }) integrationId: string,
    @Args({ name: 'accountCredentialId', type: () => GraphQLString }) accountCredentialId: string,
    @Args({ name: 'names', type: () => [GraphQLString] }) names: string[],
  ): Promise<AsyncSchemaDto> {
    const integration = await this.integrationService.findOne({
      _id: integrationId,
      owner: userId,
    })
    if (!integration) {
      throw new NotFoundException('Integration not found')
    }

    const { credentials, accountCredential, integrationAccount } =
      await this.runnerService.getCredentialsAndIntegrationAccount(accountCredentialId, () => {
        throw new NotFoundException('Account credential not found')
      })

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)

    const props = {
      integration,
      integrationAccount,
      inputs: {}, // TODO
      credentials,
      accountCredential,
      operationRunnerService: this.operationRunnerService,
    }

    const schemas: { [key: string]: JSONSchema7 } = {}
    for (const name of names) {
      if (definition.asyncSchemas[name]) {
        try {
          schemas[name] = await definition.asyncSchemas[name](props)
        } catch (e) {
          this.logger.error(`Error while getting async schema for ${name} on ${integration.key}:`, e)
        }
      }
    }

    return {
      schemas,
    }
  }
}
