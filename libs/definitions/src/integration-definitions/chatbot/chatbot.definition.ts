import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SendChatbotMessageAction } from './actions/send-chatbot-message.action'
import { NewChatbotMessageTrigger } from './triggers/new-chatbot-message'

export class ChatbotDefinition extends SingleIntegrationDefinition {
  integrationKey = 'chatbot'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewChatbotMessageTrigger()]
  actions = [new SendChatbotMessageAction()]
}
