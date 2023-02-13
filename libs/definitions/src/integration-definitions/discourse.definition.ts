import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { PipedreamMixin } from '../mixins/pipedream.mixin'
import { IntegrationAuthDefinition, IntegrationAuthType } from '../types/IntegrationAuthDefinition'

export class DiscourseDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'discourse'
  pipedreamKey = 'discourse'
  integrationVersion = '1'
  schemaUrl = null

  protected integrationAccount: IntegrationAccount | undefined

  async createOrUpdateIntegrationAccount(): Promise<IntegrationAccount | null> {
    if (!this.integrationAccount) {
      const authDefinition: IntegrationAuthDefinition = {
        authType: IntegrationAuthType.http,
        schema: {
          type: 'object',
          required: ['domain', 'api_username', 'api_key'],
          exposed: ['domain', 'api_username'],
          properties: {
            domain: {
              type: 'string',
              title: 'Domain',
            },
            api_username: {
              type: 'string',
              title: 'API Username',
            },
            api_key: {
              type: 'string',
              title: 'API Key',
              format: 'password',
            },
          },
        },
      }

      this.logger.debug('Creating or updating integration account for Discourse')
      this.integrationAccount = await IntegrationAccountService.instance.createOrUpdateOne({
        key: this.integrationKey,
        name: 'Discourse',
        authType: authDefinition.authType,
        fieldsSchema: authDefinition.schema,
      })
    }

    return this.integrationAccount
  }

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/discourse/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
