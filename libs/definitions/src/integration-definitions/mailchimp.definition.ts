import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { OpenAPIObject } from 'openapi3-ts'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class MailchimpDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'mailchimp'
  pipedreamKey = 'mailchimp'
  integrationVersion = '1'
  schemaUrl = null

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const integrationAccount = await super.createOrUpdateIntegrationAccount(schema)
    if (!integrationAccount) {
      return null
    }
    // mailchimp needs custom auth because we need to fetch the data center for the account
    return await IntegrationAccountService.instance.updateOne(integrationAccount.id, {
      customStrategyKey: 'mailchimp',
    })
  }

  async getExternalOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/mailchimp/${type}/${key}/${key}.mjs`)
    return op.default
  }

  parseError(e: any) {
    const errorData = e?.response?.data
    if (errorData?.detail ?? errorData?.errors?.length) {
      return (errorData.detail ?? '') + ' ' + errorData.errors?.map((e) => e.message).join(',')
    }
    return super.parseError(e)
  }
}
