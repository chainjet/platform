import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CheckXmtpEnabled } from './actions/check-xmtp-enabled'
import { SendMessageConversationAction } from './actions/send-message-conversation.action'
import { SendMessageAddressAction } from './actions/send-message-lens.action'
import { SendMessageWalletAction } from './actions/send-message-wallet.action'
import { NewConversationTrigger } from './triggers/new-conversation'
import { NewMessageTrigger } from './triggers/new-message'
import { NewMessageSentTrigger } from './triggers/new-message-sent'

export class XmtpDefinition extends SingleIntegrationDefinition {
  integrationKey = 'xmtp'
  integrationVersion = '1'
  schemaUrl = null

  triggers = [new NewConversationTrigger(), new NewMessageTrigger(), new NewMessageSentTrigger()]
  actions = [
    new SendMessageConversationAction(),
    new SendMessageAddressAction(),
    new SendMessageWalletAction(),
    new CheckXmtpEnabled(),
  ]
}
