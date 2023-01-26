import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CheckPromptModerationAction } from './actions/check-prompt-moderation.action'
import { GenerateImageAction } from './actions/generate-image.action'
import { SendPromptAction } from './actions/send-prompt.action'

export class OpenAiDefinition extends SingleIntegrationDefinition {
  integrationKey = 'openai'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [new SendPromptAction(), new GenerateImageAction(), new CheckPromptModerationAction()]
}
