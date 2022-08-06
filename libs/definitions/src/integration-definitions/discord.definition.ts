import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { JSONSchema7 } from 'json-schema'
import { OpenAPIObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { GetAsyncSchemasProps, RequestInterceptorOptions } from '../definition'

const CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  GUILD_STORE: 6,
  GUILD_NEWS_THREAD: 10,
  GUILD_PUBLIC_THREAD: 11,
  GUILD_PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
}

export class DiscordDefinition extends SingleIntegrationDefinition {
  integrationKey = 'discord'
  integrationVersion = '10'
  schemaUrl = null

  async createOrUpdateIntegrationAccount(schema: OpenAPIObject): Promise<IntegrationAccount | null> {
    const integrationAccount = await super.createOrUpdateIntegrationAccount(schema)
    if (!integrationAccount) {
      return integrationAccount
    }
    return await this.integrationAccountService.createOrUpdateOne({
      key: integrationAccount.key,
      authParams: {
        permissions: 8,
      },
    })
  }

  requestInterceptor({ req }: RequestInterceptorOptions): OptionsWithUrl {
    req.headers = req.headers ?? {}
    req.headers.Authorization = `Bot ${process.env.DISCORD_BOT_TOKEN}`
    return req
  }

  asyncSchemas: { [key: string]: (props: GetAsyncSchemasProps) => Promise<JSONSchema7> } = {
    channelId: async (props: GetAsyncSchemasProps) => {
      const guilds = await props.operationRunnerService.runActionByKey(this, { ...props, key: 'getCurrentUserGuilds' })
      const guildId: string = (guilds.outputs?.[0] as any)?.id
      if (!guildId) {
        return {}
      }
      const channels = await props.operationRunnerService.runActionByKey(this, {
        ...props,
        key: 'getGuildChannels',
        inputs: {
          guildId,
        },
      })
      if (!channels.outputs?.length) {
        return {}
      }
      return {
        oneOf: (channels.outputs as unknown as any[])
          .filter(
            (channels) =>
              ![
                CHANNEL_TYPES.GUILD_VOICE,
                CHANNEL_TYPES.GUILD_CATEGORY,
                CHANNEL_TYPES.GUILD_NEWS_THREAD,
                CHANNEL_TYPES.GUILD_PUBLIC_THREAD,
                CHANNEL_TYPES.GUILD_PRIVATE_THREAD,
                CHANNEL_TYPES.GUILD_STAGE_VOICE,
                CHANNEL_TYPES.GUILD_DIRECTORY,
                CHANNEL_TYPES.GUILD_FORUM,
              ].includes(channels.type),
          )
          .map((channel) => ({
            title: channel.name,
            const: channel.id,
          })),
      }
    },
  }
}
