import { AuthenticationError } from '@app/common/errors/authentication-error'
import { ContactsExceededError } from '@app/common/errors/contacts-exceeded.error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { Conversation } from '@xmtp/xmtp-js'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { User } from 'apps/api/src/users/entities/user'
import { NotificationMessages } from 'apps/api/src/users/notification-messages'
import { NotificationService } from 'apps/api/src/users/services/notifications.service'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'
import { XmtpLib } from '../xmtp.lib'

export class SendMessageConversationAction extends OperationOffChain {
  key = 'sendMessageConversation'
  name = 'Send a message to a conversation'
  description = 'Send a message to an existing conversation'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['conversationId', 'message'],
    properties: {
      conversationId: {
        title: 'Conversation ID',
        type: 'string',
        description: 'ID of the conversation to send the message to',
      },
      message: {
        title: 'Message',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Message to send',
      } as JSONSchema7Definition,
    },
  }
  outputs: JSONSchema7 = {
    ...xmtpMessageSchema,
  }

  async run({ inputs, credentials, user }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    const client = await XmtpLib.getClient(credentials.keys)
    const conversations = (await client.conversations.list()).reverse()

    let conversation: Conversation | undefined

    if (inputs.conversationId.startsWith('*0x') && isAddress(inputs.conversationId.slice(1))) {
      conversation = conversations.find(
        (conversation) =>
          !conversation.context?.conversationId && conversation.peerAddress === inputs.conversationId.slice(1),
      )
    }
    if (!conversation) {
      conversation = conversations.find(
        (conversation) =>
          conversation.context?.conversationId && conversation.context.conversationId === inputs.conversationId,
      )
    }

    if (!conversation) {
      throw new Error(`Conversation ${inputs.conversationId} not found`)
    }

    const message = await conversation.send(inputs.message)
    try {
      await ContactService.instance.addSingleContact(conversation.peerAddress, user as User)
    } catch (e) {
      if (!(e instanceof ContactsExceededError)) {
        throw e
      }
    }

    return {
      outputs: mapXmtpMessageToOutput(message) as any,
    }
  }
}
