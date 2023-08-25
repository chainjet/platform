import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { getChatCompletion } from '@chainjet/tools'
import { Conversation } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { isAddress } from 'ethers/lib/utils'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { XmtpLib } from '../../xmtp/xmtp.lib'

export class SendAiMessageAction extends OperationAction {
  key = 'sendAiMessage'
  name = 'Send AI Message'
  description = 'Send a message response with AI'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['conversationId', 'prompt'],
    properties: {
      // conversation ID is automatically filled in by the trigger
      conversationId: {
        title: 'Conversation ID',
        type: 'string',
        description: 'ID of the conversation to send the message to',
        'x-if:chatbot': {
          'x-ui:widget': 'hidden',
          default: '{{trigger.conversation.id}}',
        },
      } as JSONSchema7Definition,
      prompt: {
        title: 'Prompt',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Instructions for the AI to follow when generating a response.',
        default: 'You are a helpful assistant.',
      } as JSONSchema7Definition,
      waitForResponse: {
        title: 'Wait for response',
        type: 'boolean',
        description: 'Wait for a response from the user before continuing',
        default: false,
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      responseId: {
        title: 'Response Message ID',
        type: 'string',
      },
      responseContent: {
        title: 'Response Message Content',
        type: 'string',
      },
    },
  }

  async run({ inputs, credentials, previousOutputs }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.keys) {
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    const client = await XmtpLib.getClient(credentials.keys, credentials.env ?? 'production')
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

    const messages = (previousOutputs?.messages ?? []).map((message) => ({
      content: message.content,
      role: message.from === 'user' ? 'user' : 'assistant',
    }))
    const content = await getChatCompletion([
      { role: 'system', content: inputs.prompt },
      ...messages,
      { role: 'user', content: previousOutputs!.message.content },
    ])
    const message = await conversation.send(content)
    if (previousOutputs?.messages) {
      previousOutputs.messages.push({ content, from: 'bot' })
    }

    return {
      outputs: {
        id: message.id,
      },
      sleepUniqueGroup: inputs.waitForResponse ? inputs.conversationId : undefined,
    }
  }
}
