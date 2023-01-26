import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SendPromptAction } from './actions/send-prompt.action'

export class OpenAiDefinition extends SingleIntegrationDefinition {
  integrationKey = 'openai'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new SendPromptAction()]
}
