import { GetAsyncSchemasProps, RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { AsyncSchema } from '@app/definitions/types/AsyncSchema'
import { UnauthorizedException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { TelegramLib } from '../telegram.lib'

export class SendImageAction extends OperationOffChain {
  key = 'sendImage'
  name = 'Send Image'
  description = 'Send an image by URL'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['image'],
    properties: {
      image: {
        title: 'Image URL',
        type: 'string',
        description:
          'URL of the image to send. You can also pass a file_id as String to send an image that exists on the Telegram servers.',
      },
      caption: {
        title: 'Image Caption',
        type: 'string',
        description: 'Add a caption below the image.',
        maxLength: 1024,
      },
      disableNotification: TelegramLib.fields.disableNotification,
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
    const res = await TelegramLib.getClient().sendPhoto(credentials.chatId, inputs.image, {
      caption: inputs.caption,
      parse_mode: 'Markdown',
      disable_notification: inputs.disableNotification,
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
