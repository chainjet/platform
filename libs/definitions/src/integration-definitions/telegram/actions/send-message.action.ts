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
      disableNotification: TelegramLib.fields.disableNotification,
      disableLinkPreview: {
        title: 'Disable Link Preview',
        type: 'boolean',
        description: 'Whether to disable link previews for links in this message.',
      },
      replyToMessageId: TelegramLib.fields.replyToMessageId,
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
  asyncSchemas: AsyncSchema[] = [{ name: 'pinMessage' }, { name: 'topicId' }]

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse> {
    if (!credentials.chatId) {
      throw new UnauthorizedException('Telegram account disconected')
    }
    const res = await TelegramLib.getClient().sendMessage(credentials.chatId, inputs.text, {
      parse_mode: 'Markdown',
      disable_notification: inputs.disableNotification,
      disable_web_page_preview: inputs.disableLinkPreview,
      reply_to_message_id: inputs.replyToMessageId,
      message_thread_id: inputs.topicId,
    })
    if (inputs.pinMessage) {
      await TelegramLib.getClient().pinChatMessage(credentials.chatId, res.message_id)
    }
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
      pinMessage: (props) => TelegramLib.getPinMessageAsyncSchema(props),
      topicId: (props) => TelegramLib.getTopicIdAsyncSchema(props),
    }
  }
}
