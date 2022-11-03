import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { UnauthorizedException } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { StaticRunner } from 'apps/runner/src/services/static-runner.service'
import { InteractionResponseType, InteractionType, verifyKey } from 'discord-interactions'
import { Request } from 'express'
import { OpenAPIObject } from 'openapi3-ts'
import { OptionsWithUrl } from 'request'
import { GetAsyncSchemasProps, IntegrationHookInjects, RequestInterceptorOptions, StepInputs } from '../definition'

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

/**
 * @important Discord bot does not check for permissions. Anyone could use permissions approved by other users.
 * We need to be careful to check permissions before executing actions.
 * Users should only be able to access to the server with ID {credentials.guild_id}
 */

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
      queryStringCredentials: ['guild_id', 'permissions'],
    })
  }

  requestInterceptor({ req }: RequestInterceptorOptions): OptionsWithUrl {
    req.headers = req.headers ?? {}
    req.headers.Authorization = `Bot ${process.env.DISCORD_BOT_TOKEN}`
    return req
  }

  async beforeOperationRun(opts: OperationRunOptions): Promise<OperationRunOptions> {
    opts.inputs.applicationId = process.env.DISCORD_CLIENT_ID
    return opts
  }

  // We need to ensure the user has access to the guild id and the channel id belongs to the user
  // This must be run before create and update triggers and actions
  private async ensurePermissions(inputs: StepInputs, accountCredential?: AccountCredential | null) {
    const credentials = accountCredential?.credentials ?? {}
    inputs.guildId = credentials.guild_id // enforce guild id
    if (inputs.channelId) {
      const { outputs: channels } = await StaticRunner.run({
        definition: this,
        actionKey: 'getGuildChannels',
        inputs: {
          guildId: credentials.guild_id,
        },
        accountCredential,
      })
      const hasChannel = (channels as unknown as any[]).some(
        (channel) => channel.id.toString() === inputs.channelId.toString(),
      )
      if (!hasChannel) {
        throw new Error(`Invalid permissions to access channel ${inputs.channelId}`)
      }
    }
  }

  async beforeCreateWorkflowAction(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    await this.ensurePermissions(workflowAction.inputs ?? {}, accountCredential)
    return workflowAction
  }

  async beforeUpdateWorkflowAction(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> {
    await this.ensurePermissions(workflowAction.inputs ?? {}, accountCredential)
    return workflowAction
  }

  async beforeCreateWorkflowTrigger(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    await this.ensurePermissions(workflowTrigger.inputs ?? {}, accountCredential)
    switch (integrationTrigger.key) {
      case 'newSlashCommandGuild':
        await StaticRunner.run({
          definition: this,
          actionKey: 'createGuildCommand',
          inputs: {
            applicationId: process.env.DISCORD_CLIENT_ID,
            guildId: accountCredential?.credentials.guild_id,
            name: workflowTrigger.inputs?.name,
            description: workflowTrigger.inputs?.description,
          },
          accountCredential,
        })
    }
    return workflowTrigger
  }

  async beforeUpdateWorkflowTrigger(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    await this.ensurePermissions(workflowTrigger.inputs ?? {}, accountCredential)
    return workflowTrigger
  }

  async beforeDeleteWorkflowTrigger(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<void> {
    switch (integrationTrigger.key) {
      case 'newSlashCommandGuild':
        // TODO delete command
        break
    }
  }

  async onHookReceived(
    req: Request,
    injects: IntegrationHookInjects,
  ): Promise<{
    response: any
    runs: Array<{
      workflowTrigger: WorkflowTrigger
      integrationTrigger: IntegrationTrigger
      outputs: Record<string, any>
    }>
  }> {
    const { type, data } = req.body

    // Verify the webhook is from Discord. See https://discord.com/developers/docs/getting-started#handling-slash-command-requests
    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!
    const signature = req.get('X-Signature-Ed25519')
    const timestamp = req.get('X-Signature-Timestamp')
    const isVerified = verifyKey((req as any).rawBody, signature!, timestamp!, PUBLIC_KEY)
    if (!isVerified) {
      throw new UnauthorizedException('invalid request signature')
    }

    // Respond to Discord pings
    if (type === InteractionType.PING) {
      return { response: { type: InteractionResponseType.PONG }, runs: [] }
    }

    // Handle slash command requests. See https://discord.com/developers/docs/interactions/application-commands#slash-commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name, guild_id } = data

      const integrationTrigger = await injects.integrationTriggerService.findOne({ key: 'newSlashCommandGuild' }) // TODO check integration = discord
      if (!integrationTrigger) {
        throw new Error(`Integration trigger for discord slash command not configured correctly`)
      }

      // TODO add an indexed field to workflowTriggers to allow for fast queries (i.e. workflowTrigger.hookQuery = 12345)
      const workflowTriggers = await injects.workflowTriggerService.find({
        integrationTrigger: integrationTrigger.id,
      })
      const workflowTriggersForGuild = workflowTriggers.filter((trigger) => trigger.inputs?.guildId === guild_id)
      const workflowTriggersForCommand = workflowTriggersForGuild.filter((trigger) => trigger.inputs?.name === name)

      return {
        response: {
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        },
        runs: workflowTriggersForCommand.map((workflowTrigger) => ({
          workflowTrigger,
          integrationTrigger,
          outputs: req.body,
        })),
      }
    }
    throw new Error(`Unsupported interaction type ${type} on discord integration`)
  }

  async getAsyncSchemas() {
    return {
      channelId: async (props: GetAsyncSchemasProps) => {
        const channelOutputs = await props.operationRunnerService.runActionByKey(this, {
          ...props,
          key: 'getGuildChannels',
          inputs: {
            guildId: props.credentials.guild_id,
          },
        })
        const channels = (channelOutputs.outputs as unknown as any[]) // TODO fix type on definition.ts
          .filter(
            (channel) =>
              ![
                CHANNEL_TYPES.GUILD_CATEGORY,
                CHANNEL_TYPES.GUILD_NEWS_THREAD,
                CHANNEL_TYPES.GUILD_PUBLIC_THREAD,
                CHANNEL_TYPES.GUILD_PRIVATE_THREAD,
                CHANNEL_TYPES.GUILD_STAGE_VOICE,
                CHANNEL_TYPES.GUILD_DIRECTORY,
                CHANNEL_TYPES.GUILD_FORUM,
              ].includes(channel.type),
          )
        if (!channels?.length) {
          return {}
        }
        return {
          default: channels[0].id,
          oneOf: channels
            .filter(
              (channel) =>
                ![
                  CHANNEL_TYPES.GUILD_CATEGORY,
                  CHANNEL_TYPES.GUILD_NEWS_THREAD,
                  CHANNEL_TYPES.GUILD_PUBLIC_THREAD,
                  CHANNEL_TYPES.GUILD_PRIVATE_THREAD,
                  CHANNEL_TYPES.GUILD_STAGE_VOICE,
                  CHANNEL_TYPES.GUILD_DIRECTORY,
                  CHANNEL_TYPES.GUILD_FORUM,
                ].includes(channel.type),
            )
            .map((channel) => ({
              title: channel.type === CHANNEL_TYPES.GUILD_VOICE ? `${channel.name} (Voice)` : channel.name,
              const: channel.id,
            })),
        }
      },
    }
  }
}
