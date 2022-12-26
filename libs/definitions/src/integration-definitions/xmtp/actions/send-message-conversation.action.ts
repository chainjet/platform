import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { Client } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'

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

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new Error(`Missing keys for XMTP`)
    }
    const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
    const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })
    const conversations = (await client.conversations.list()).reverse()

    let conversation = conversations.find(
      (conversation) =>
        conversation.context?.conversationId && conversation.context.conversationId === inputs.conversationId,
    )

    if (!conversation) {
      throw new Error(`Conversation ${inputs.conversationId} not found`)
    }

    const message = await conversation.send(inputs.message)

    return {
      outputs: mapXmtpMessageToOutput(message),
    }
  }
}
