import { StaticCacheManagerService } from '@app/common/cache/static-cache-manager.service'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { IntegrationHookInjects } from '@app/definitions/definition'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { Integration } from 'apps/api/src/integrations/entities/integration'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Message } from 'node-telegram-bot-api'
import { ParsedQs } from 'qs'
import { SendImageAction } from './actions/send-image.action'
import { SendMessageAction } from './actions/send-message.action'
import { SendVideoAction } from './actions/send-video.action'
import { NewCommandReceived } from './triggers/new-command-received.trigger'

export class TelegramDefinition extends SingleIntegrationDefinition {
  protected readonly logger = new Logger(TelegramDefinition.name)

  integrationKey = 'telegram'
  integrationVersion = '1'

  triggers = [new NewCommandReceived()]
  actions = [new SendMessageAction(), new SendImageAction(), new SendVideoAction()]

  async onHookReceived(
    req: Request<ParamsDictionary, any, any, ParsedQs>,
    integration: Integration,
    injects: IntegrationHookInjects,
  ): Promise<{
    response: any
    runs: { workflowTrigger: WorkflowTrigger; integrationTrigger: IntegrationTrigger; outputs: Record<string, any> }[]
  }> {
    if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_BOT_API_KEY!.split(':')[1]) {
      throw new UnauthorizedException('Not allowed')
    }
    const message: Message = req.body.message
    if (!message) {
      return {
        response: {},
        runs: [],
      }
    }
    const { text } = message
    if (!text?.startsWith('/')) {
      return {
        response: {},
        runs: [],
      }
    }
    if (text.startsWith('/start')) {
      await this.createAccountCredentials(text.split(' ')[1]?.trim(), message, injects)
    }
    const command = text.split(' ')[0].substring(1)

    // TODO use an indexed field to find the workflow triggers directly without using account credentials
    const integrationAccount = await injects.integrationAccountService.findOne({ key: 'telegram' })
    if (!integrationAccount) {
      this.logger.error(`Integration account not found for Telegram`)
      return {
        response: {},
        runs: [],
      }
    }
    const accountCredentials = await injects.accountCredentialsService.find({
      integrationAccount: integrationAccount._id,
    })
    const credentialsForChatId = accountCredentials.filter((c) => c.fields.chatId === message.chat.id)
    if (!credentialsForChatId.length) {
      return {
        response: {},
        runs: [],
      }
    }

    const integrationTrigger = await injects.integrationTriggerService.findOne({
      integration: integration._id,
      key: 'newCommandReceived',
    })
    if (!integrationTrigger) {
      this.logger.error(`Integration trigger not found for Telegram New Command Received`)
      return {
        response: {},
        runs: [],
      }
    }
    const workflowTriggers = await injects.workflowTriggerService.find({
      // integrationTrigger: integrationTrigger._id,
      credentials: {
        $in: credentialsForChatId.map((c) => c._id),
      },
    })
    const workflowTriggersForCommand = workflowTriggers.filter((t) => t.inputs?.command === `/${command}`)

    return {
      response: {},
      runs: workflowTriggersForCommand.map((workflowTrigger) => ({
        workflowTrigger,
        integrationTrigger,
        outputs: {
          messageId: message.message_id,
          params: text.split(' ')[1]?.trim(),
          text: message.text,
          chatId: message.chat.id,
          topicId: message.message_thread_id,
          from: {
            id: message.from?.id,
            username: message.from?.username,
            firstName: message.from?.first_name,
            lastName: message.from?.last_name,
            isBot: message.from?.is_bot,
            languageCode: message.from?.language_code,
          },
          date: new Date(message.date * 1000).toISOString(),
        },
      })),
    }
  }

  async createAccountCredentials(
    key: string,
    message: Message,
    { accountCredentialsService, integrationAccountService }: IntegrationHookInjects,
  ): Promise<boolean> {
    const userId = await StaticCacheManagerService.cacheManager.get(`telegram:create-account-key:${key}`)
    if (userId) {
      const integrationAccount = await integrationAccountService.findOne({ key: 'telegram' })
      if (!integrationAccount) {
        this.logger.error(`Integration account not found for Telegram`)
        throw new Error('Integration account not found')
      }
      this.logger.log(`Creating telegram account credentials for user ${userId} and chatId ${message.chat.id}`)

      let name: string
      if (message.chat.type === 'private') {
        name = `Telegram private chat with ${message.chat.username}`
      } else {
        name = `Telegram group ${message.chat.title}`
      }

      await accountCredentialsService.createOne({
        owner: userId as any,
        integrationAccount: integrationAccount?._id,
        name,
        credentialInputs: {},
        fields: {
          chatId: message.chat.id,
          type: message.chat.type,
        },
      })
      return true
    } else {
      this.logger.error(`Error authenticating telegram account for user ${userId}: Key ${key} not found.`)
    }
    return false
  }

  async getAccountCreationData(userId: string) {
    const key = SecurityUtils.generateRandomString(32)
    await StaticCacheManagerService.cacheManager.set(`telegram:create-account-key:${key}`, userId, {
      ttl: 60 * 60,
    } as any)
    return {
      key,
    }
  }
}
