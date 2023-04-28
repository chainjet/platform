import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { UnauthorizedException } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { DiscordLib } from '../discord.lib'

export class NewSlashCommandGuild extends OperationTrigger {
  idKey = ''
  key = 'newSlashCommandGuild'
  name = 'New slash command on a server'
  description = 'Triggers when a slash command is sent on a server.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: ['name', 'description'],
    properties: {
      name: {
        title: 'Name',
        type: 'string',
        description: 'Name of the command.',
        maxLength: 32,
      },
      description: {
        title: 'Description',
        type: 'string',
        description: 'Description of the command',
        maxLength: 100,
      },
      options: {
        title: 'Options',
        type: 'array',
        description: 'Options of the command',
        items: {
          type: 'object',
          properties: {
            name: {
              title: 'Name',
              type: 'string',
              description: 'Name of the option.',
              maxLength: 32,
            },
            description: {
              title: 'Description',
              type: 'string',
              description: 'Description of the option',
              maxLength: 100,
            },
          },
        },
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      app_permissions: { type: 'string' },
      application_id: { type: 'string' },
      channel_id: { type: 'string' },
      data: {
        type: 'object',
        properties: {
          guild_id: { type: 'string' },
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'integer' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'integer' },
                value: { type: 'string' },
              },
            },
          },
        },
      },
      guild_id: { type: 'string' },
      guild_locale: { type: 'string' },
      id: { type: 'string' },
      locale: { type: 'string' },
      member: {
        type: 'object',
        properties: {
          avatar: { type: 'string' },
          communication_disabled_until: { type: 'string' },
          deaf: { type: 'boolean' },
          flags: { type: 'integer' },
          is_pending: { type: 'boolean' },
          joined_at: { type: 'string' },
          mute: { type: 'boolean' },
          nick: { type: 'string' },
          pending: { type: 'boolean' },
          permissions: { type: 'string' },
          premium_since: { type: 'string' },
          roles: { type: 'array', items: {} },
          user: {
            type: 'object',
            properties: {
              avatar: { type: 'string' },
              discriminator: { type: 'string' },
              id: { type: 'string' },
              public_flags: { type: 'integer' },
              username: { type: 'string' },
            },
          },
        },
      },
      token: { type: 'string' },
      type: { type: 'integer' },
      version: { type: 'integer' },
    },
  }

  async beforeCreate(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    if (!accountCredential?.credentials.guild_id) {
      throw new UnauthorizedException('Missing guild id')
    }
    const data = await DiscordLib.createCommand({
      guildId: accountCredential.credentials.guild_id,
      name: workflowTrigger.inputs?.name,
      description: workflowTrigger.inputs?.description,
      options: workflowTrigger.inputs?.options?.map((option) => ({
        name: option.name,
        description: option.description,
        type: 3,
        required: true,
      })),
    })
    workflowTrigger.store = workflowTrigger.store ?? {}
    workflowTrigger.store.commandId = data.id
    return workflowTrigger
  }

  async beforeUpdate(
    update: Partial<WorkflowTrigger>,
    prevWorkflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> {
    if (!accountCredential?.credentials.guild_id) {
      throw new UnauthorizedException('Missing guild id')
    }
    if (!prevWorkflowTrigger.store?.commandId) {
      prevWorkflowTrigger.store = prevWorkflowTrigger.store ?? {}
      prevWorkflowTrigger.store.commandId = await DiscordLib.getCommandIdByName(
        accountCredential.credentials.guild_id,
        prevWorkflowTrigger.inputs!.name,
      )
      if (!prevWorkflowTrigger.store.commandId) {
        // if the command doesn't exist, create it
        return this.beforeCreate(update, integrationTrigger, accountCredential)
      }
    }
    await DiscordLib.updateCommand({
      guildId: accountCredential.credentials.guild_id,
      commandId: prevWorkflowTrigger.store?.commandId,
      name: update.inputs?.name,
      description: update.inputs?.description,
      options: update.inputs?.options?.map((option) => ({
        name: option.name,
        description: option.description,
        type: 3,
        required: true,
      })),
    })
    return update
  }

  async beforeDelete(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ) {
    // try to delete the command, but ignore errors. The command might not exist anymore
    if (accountCredential?.credentials.guild_id && workflowTrigger.store?.commandId) {
      try {
        await DiscordLib.deleteCommand({
          guildId: accountCredential.credentials.guild_id,
          commandId: workflowTrigger.store?.commandId,
        })
      } catch {}
    }
  }

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error('Cannot run an instant trigger')
  }
}
