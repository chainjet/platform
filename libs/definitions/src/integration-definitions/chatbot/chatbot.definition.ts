import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { NewMessageTrigger } from './triggers/new-message'

export class ChatbotDefinition extends SingleIntegrationDefinition {
  integrationKey = 'chatbot'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewMessageTrigger()]
  actions = []
}
