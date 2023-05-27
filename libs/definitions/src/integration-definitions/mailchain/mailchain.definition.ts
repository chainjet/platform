import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { OpenAPIObject } from 'openapi3-ts'
import { SendEmailAction } from './actions/send-email.action'

export class MailChainDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mailchain'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new SendEmailAction()]

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const authDefinition = await this._getAuthDefinition()
    if (!authDefinition) {
      return null
    }
    authDefinition.schema!.required = ['privateMessagingKey', 'email']
    authDefinition.schema!.properties = {
      privateMessagingKey: {
        type: 'string',
        title: 'Private Messaging Key',
        description:
          'To find the key, go to [https://app.mailchain.com/settings](https://app.mailchain.com/settings) and select the account you want to connect. Then click on "View messaging key".\n\n**Best Practice**: We recommend creating and registering a wallet address for the purpose of sending notifications.',
      },
      email: {
        type: 'string',
        title: 'Email Address associated with the Private Messaging Key',
        examples: ['chainjet@mailchain.com'],
      },
    }
    this.logger.debug(`Creating or updating integration account for ${this.integrationKey}`)
    return await IntegrationAccountService.instance.createOrUpdateOne({
      key: this.integrationKey,
      name: schema.info.title,
      description: '',
      ...authDefinition,
      fieldsSchema: authDefinition.schema,
    })
  }
}
