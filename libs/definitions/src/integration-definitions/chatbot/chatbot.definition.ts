import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { GetInfoAction } from './actions/get-info.action'
import { GetUserIntentAction } from './actions/get-user-intent.action'
import { SendAiMessageAction } from './actions/send-ai-message.action'
import { SendChatbotMessageAction } from './actions/send-chatbot-message.action'
import { NewChatbotMessageTrigger } from './triggers/new-chatbot-message'

export class ChatbotDefinition extends SingleIntegrationDefinition {
  integrationKey = 'chatbot'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewChatbotMessageTrigger()]
  actions = [new SendChatbotMessageAction(), new SendAiMessageAction(), new GetUserIntentAction(), new GetInfoAction()]
}
