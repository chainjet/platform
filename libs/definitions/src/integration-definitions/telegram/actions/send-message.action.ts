import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { UnauthorizedException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { TelegramLib } from '../telegram.lib'

export class SendMessageAction extends OperationOffChain {
  key = 'sendMessage'
  name = 'Send Text Message'
  description = 'Send a text message or reply'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['text'],
    properties: {
      text: {
        title: 'Message Text',
        type: 'string',
        description: 'The text message that the bot will send',
        'x-ui:widget': 'textarea',
      } as JSONSchema7,
      disableNotification: {
        title: 'Disable Notification',
        type: 'boolean',
        description:
          'Whether to send the message silently. iOS users will not receive a notification, Android users will receive a notification with no sound.',
      },
      disableLinkPreview: {
        title: 'Disable Link Preview',
        type: 'boolean',
        description: 'Whether to disable link previews for links in this message.',
      },
      replyToMessageId: {
        title: 'Reply To Message ID',
        type: 'number',
        description: 'If you are replying to a message, the ID of the original message',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      message: {
        title: 'Message',
        type: 'object',
        properties: {
          messageId: {
            title: 'Message ID',
            type: 'number',
          },
        },
      },
    },
  }
  asyncSchemas: AsyncSchema[] = [{ name: 'topic' }]

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.chatId) {
      throw new UnauthorizedException('Telegram account disconected')
    }
    const res = await TelegramLib.getClient().sendMessage(credentials.chatId, inputs.text, {
      parse_mode: 'Markdown',
      disable_notification: inputs.disableNotification,
      disable_web_page_preview: inputs.disableLinkPreview,
      reply_to_message_id: inputs.replyToMessageId,
      message_thread_id: inputs.topic,
    })
    return {
      outputs: {
        message: {
          messageId: res.message_id,
        },
      },
    }
  }

  async getAsyncSchemas(): Promise<{ [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> }> {
    return {
      topic: async ({ credentials }: GetAsyncSchemasProps) => {
        if (credentials.type !== 'supergroup') {
          return {}
        }
        const chat = await TelegramLib.getClient().getChat(credentials.chatId)
        if (!chat?.is_forum) {
          return {}
        }
        return {
          title: 'Topic ID',
          type: 'number',
          description:
            'The ID of the forum topic to send the message to. To find the ID, right click any message in the topic and select "Copy Message Link". The ID is the second number on the link. For example, if the link is https://t.me/c/123456789/12/34, the ID is 12.',
        }
      },
    }
  }
}
