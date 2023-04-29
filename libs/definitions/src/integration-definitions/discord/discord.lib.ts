import { Logger, UnauthorizedException } from '@nestjs/common'
import axios from 'axios'

export const DiscordLib = {
  logger: new Logger('DiscordLib'),

  async createCommand({
    guildId,
    name,
    description,
    options = [],
  }: {
    guildId: string
    name: string
    description: string
    options: any[]
  }) {
    const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands`
    const command = {
      name,
      description,
      options,
    }
    const response = await axios.post(url, command, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    return response.data
  },

  async updateCommand({
    guildId,
    commandId,
    name,
    description,
    options = [],
  }: {
    guildId: string
    commandId: string
    name: string
    description: string
    options: any[]
  }) {
    const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands/${commandId}`
    const command = {
      name,
      description,
      options,
    }
    const response = await axios.patch(url, command, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    return response.data
  },

  async deleteCommand({ guildId, commandId }: { guildId: string; commandId: string }) {
    const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands/${commandId}`
    const response = await axios.delete(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    return response.status
  },

  async deleteAllCommands(guildId: string) {
    const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands`

    // First, list all the commands
    const listCommandsResponse = await axios.get(url, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    })

    // Delete each command in the server
    for (const command of listCommandsResponse.data) {
      await axios.delete(`${url}/${command.id}`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      })
    }
  },

  async getCommandIdByName(guildId: string, commandName: string): Promise<string | null> {
    const url = `https://discord.com/api/v9/applications/${process.env.DISCORD_CLIENT_ID}/guilds/${guildId}/commands`

    this.logger.log(`Getting command ID for ${commandName}`)

    try {
      // List all the commands
      const listCommandsResponse = await axios.get(url, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      })

      // Find the command with the specified name
      const command = listCommandsResponse.data.find((cmd: any) => cmd.name === commandName)

      if (!command) {
        console.log('Command not found')
        return null
      }

      // Return the command ID
      return command.id
    } catch (error) {
      this.logger.error('Error retrieving command ID:', error)
      return null
    }
  },

  async getGuildChannels(guildId: string): Promise<any[] | null> {
    const url = `https://discord.com/api/v9/guilds/${guildId}/channels`

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      })
      return response.data
    } catch (error) {
      this.logger.error('Error retrieving guild channels:', error)
      return null
    }
  },

  // We need to ensure the user has access to the guild id and the channel id belongs to the user
  // This must be run before create and update triggers and actions
  async ensurePermissions(inputs: Record<string, any>, credentials: Record<string, any>) {
    inputs.guildId = credentials.guild_id // enforce guild id
    if (inputs.channelId) {
      const channels = await this.getGuildChannels(inputs.guildId)
      const hasChannel = (channels as unknown as any[]).some(
        (channel) => channel.id.toString() === inputs.channelId.toString(),
      )
      if (!hasChannel) {
        throw new UnauthorizedException(`Invalid permissions to access channel ${inputs.channelId}`)
      }
    }
  },
}
