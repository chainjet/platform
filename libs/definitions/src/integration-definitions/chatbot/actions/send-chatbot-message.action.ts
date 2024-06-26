import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import { XmtpLib } from '../../xmtp/xmtp.lib'

export class SendChatbotMessageAction extends OperationOffChain {
  key = 'sendChatbotMessage'
  name = 'Send Message'
  description = 'Send a message response'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['conversationId', 'message'],
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
      message: {
        title: 'Message',
        type: 'string',
        'x-ui:widget': 'textarea',
        description: 'Message to send',
      } as JSONSchema7Definition,
      waitForResponse: {
        title: 'Wait for response',
        type: 'boolean',
        description: 'Wait for a response from the user before continuing',
        default: false,
      },
    },
    // if: {
    //   properties: {
    //     waitForResponse: { const: true },
    //   },
    // },
    // then: {
    //   required: ['expiresIn'],
    //   properties: {
    //     expiresIn: {
    //       title: 'Expires in',
    //       type: 'integer',
    //       default: 60,
    //       oneOf: [
    //         { const: 1, title: '1 minute' },
    //         { const: 15, title: '15 minutes' },
    //         { const: 30, title: '30 minutes' },
    //         { const: 60, title: '1 hour' },
    //         { const: 180, title: '3 hours' },
    //         { const: 360, title: '6 hours' },
    //         { const: 720, title: '12 hours' },
    //         { const: 1440, title: '24 hours' },
    //       ],
    //     },
    //   },
    // }
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
    const message = await XmtpLib.sendMessage(client, inputs.conversationId, inputs.message, previousOutputs?.messages)

    return {
      outputs: {
        id: message.id,
      },
      sleepUniqueGroup: inputs.waitForResponse ? inputs.conversationId : undefined,
    }
  }
}
