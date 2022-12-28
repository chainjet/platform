import { PipedreamMixin } from '@app/definitions/mixins/pipedream.mixin'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { OpenAPIObject } from 'openapi3-ts'

export class NotionDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'notion'
  pipedreamKey = 'notion'
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
        user: 'owner',
      },
      customStrategyKey: 'notion',
    })
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../../dist/pipedream/components/notion/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
