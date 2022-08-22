import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { PipedreamMixin } from '../mixins/pipedream.mixin'

export class TelegramBotDefinition extends PipedreamMixin(SingleIntegrationDefinition) {
  integrationKey = 'telegram-bot'
  pipedreamKey = 'telegram_bot_api'
  integrationVersion = '1'
  schemaUrl = null

  async getOperation(type: string, key: string) {
    const op = await import(`../../../../dist/pipedream/components/telegram_bot_api/${type}/${key}/${key}.mjs`)
    return op.default
  }
}
