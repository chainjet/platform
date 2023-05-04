import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SendEmailAction } from './actions/send-email.action'

export class MailChainDefinition extends SingleIntegrationDefinition {
  integrationKey = 'mailchain'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new SendEmailAction()]
}
