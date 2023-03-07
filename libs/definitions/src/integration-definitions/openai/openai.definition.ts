import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CheckPromptModerationAction } from './actions/check-prompt-moderation.action'
import { EditPromptAction } from './actions/edit-prompt.action copy'
import { GenerateImageAction } from './actions/generate-image.action'
import { GetChatResponseAction } from './actions/get-chat-response.action'
import { SendPromptAction } from './actions/send-prompt.action'

export class OpenAiDefinition extends SingleIntegrationDefinition {
  integrationKey = 'openai'
  integrationVersion = '1'
  schemaUrl = null

  triggers = []
  actions = [
    new CheckPromptModerationAction(),
    new EditPromptAction(),
    new GenerateImageAction(),
    new GetChatResponseAction(),
    new SendPromptAction(),
  ]
}
