import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { OpenAPIObject } from 'openapi3-ts'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class RedditDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'reddit'
  pipedreamKey = 'reddit'
  integrationVersion = '1'
  schemaUrl = null

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const integrationAccount = await super.createOrUpdateIntegrationAccount(schema)
    if (!integrationAccount) {
      return null
    }
    return await IntegrationAccountService.instance.createOrUpdateOne({
      key: integrationAccount.key,
      authParams: {
        duration: 'permanent',
      },
      customStrategyKey: 'reddit',
    })
  }

  // TODO
  async getAsyncSchemas(operation: IntegrationAction | IntegrationTrigger) {
    // return getAsyncSchemasForPipedream(await this.getOperations(), operation)
    return {}
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/reddit/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
