import { GetAsyncSchemasProps } from '@app/definitions/definition'
import { JSONSchema7 } from 'json-schema'
import TelegramBot from 'node-telegram-bot-api'

export const TelegramLib = {
  _client: null as TelegramBot | null,

  fields: {
    disableNotification: {
      title: 'Disable Notification',
      type: 'boolean',
      description:
        'Whether to send the message silently. iOS users will not receive a notification, Android users will receive a notification with no sound.',
    } as JSONSchema7,
    replyToMessageId: {
      title: 'Reply To Message ID',
      type: 'number',
      description: 'If you are replying to a message, the ID of the original message',
    } as JSONSchema7,
    topicId: {
      title: 'Topic ID',
      type: 'number',
      description:
        'The ID of the forum topic to send the message to. To find the ID, right click any message in the topic and select "Copy Message Link". The ID is the second number on the link. For example, if the link is https://t.me/c/123456789/12/34, the ID is 12.',
    } as JSONSchema7,
  },

  getClient(): TelegramBot {
    if (!this._client) {
      this._client = new TelegramBot(process.env.TELEGRAM_BOT_API_KEY!, { polling: false })
    }
    return this._client
  },

  async setWebhook(client: TelegramBot = this.getClient()) {
    await client.setWebHook('https://api.chainjet.io/hooks/integration/telegram', {
      secret_token: `${process.env.TELEGRAM_BOT_API_KEY!.split(':')[1]}`,
    } as any)
  },

  async getTopicIdAsyncSchema({ credentials }: GetAsyncSchemasProps): Promise<JSONSchema7> {
    if (credentials.type !== 'supergroup') {
      return {}
    }
    const chat = await this.getClient().getChat(credentials.chatId)
    if (!chat?.is_forum) {
      return {}
    }
    return this.fields.topicId
  },
}
