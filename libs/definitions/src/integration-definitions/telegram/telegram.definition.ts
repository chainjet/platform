import { StaticCacheManagerService } from '@app/common/cache/static-cache-manager.service'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { IntegrationHookInjects } from '@app/definitions/definition'
import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { Logger, UnauthorizedException } from '@nestjs/common'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { Message } from 'node-telegram-bot-api'
import { ParsedQs } from 'qs'
import { SendImageAction } from './actions/send-image.action'
import { SendMessageAction } from './actions/send-message.action'
import { SendVideoAction } from './actions/send-video.action'

export class TelegramDefinition extends SingleIntegrationDefinition {
  protected readonly logger = new Logger(TelegramDefinition.name)

  integrationKey = 'telegram'
  integrationVersion = '1'

  triggers = []
  actions = [new SendMessageAction(), new SendImageAction(), new SendVideoAction()]

  async onHookReceived(
    req: Request<ParamsDictionary, any, any, ParsedQs>,
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
    if (text?.startsWith('/start')) {
      await this.createAccountCredentials(text.split(' ')[1]?.trim(), message, injects)
    }

    return {
      response: {},
      runs: [],
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
