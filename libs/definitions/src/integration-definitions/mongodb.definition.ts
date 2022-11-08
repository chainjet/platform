import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { PipedreamMixin } from '../mixins/pipedream.mixin'
import { IntegrationAuthDefinition, IntegrationAuthType } from '../types/IntegrationAuthDefinition'

export class MongoDBDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'mongodb'
  pipedreamKey = 'mongodb'
  integrationVersion = '1'
  schemaUrl = null

  protected integrationAccount: IntegrationAccount | undefined

  async createOrUpdateIntegrationAccount(): Promise<IntegrationAccount | null> {
    if (!this.integrationAccount) {
      const authDefinition: IntegrationAuthDefinition = {
        authType: IntegrationAuthType.http,
        schema: {
          type: 'object',
          required: ['username', 'password', 'hostname'],
          exposed: ['username'],
          properties: {
            username: {
              type: 'string',
              title: 'Username',
            },
            password: {
              type: 'string',
              title: 'Password',
              format: 'password',
            },
            hostname: {
              type: 'string',
              title: 'Hostname',
            },
          },
        },
      }

      this.logger.debug('Creating or updating integration account for MongoDB')
      this.integrationAccount = await IntegrationAccountService.instance.createOrUpdateOne({
        key: this.integrationKey,
        name: 'MongoDB',
        authType: authDefinition.authType,
        fieldsSchema: authDefinition.schema,
      })
    }

    return this.integrationAccount
  }

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/mongodb/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
