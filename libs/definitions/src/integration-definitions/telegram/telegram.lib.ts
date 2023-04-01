import TelegramBot from 'node-telegram-bot-api'

export const TelegramLib = {
  _client: null as TelegramBot | null,

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
}
