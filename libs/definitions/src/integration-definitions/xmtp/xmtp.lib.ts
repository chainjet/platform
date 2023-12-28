import { sendXmtpMessage } from '@chainjet/tools/dist/messages'
import { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js'
import { isAddress } from 'ethers/lib/utils'

const clientsCache = new Map<string, Client>()

export const XmtpLib = {
  async getClient(key: string, env: 'production' | 'dev' = 'production'): Promise<Client> {
    if (!clientsCache.has(key)) {
      const keys = new Uint8Array(key.split(',').map((key: string) => Number(key)))
      const client = await Client.create(null, {
        privateKeyOverride: keys,
        env,
        appVersion: 'ChainJet/1.0.0',
      })
      clientsCache.set(key, client)
    }
    return clientsCache.get(key)!
  },

  async sendMessage(client: Client, conversationId: string, message: string, previousMessages?: any[]) {
    if (!conversationId) {
      throw new Error(`Missing conversationId`)
    }

    const conversations = (await client.conversations.list()).reverse()

    let conversation: Conversation | undefined

    if (conversationId.startsWith('*0x') && isAddress(conversationId.slice(1))) {
      conversation = conversations.find(
        (conversation) => !conversation.context?.conversationId && conversation.peerAddress === conversationId.slice(1),
      )
    }
    if (!conversation) {
      conversation = conversations.find(
        (conversation) =>
          conversation.context?.conversationId && conversation.context.conversationId === conversationId,
      )
    }

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`)
    }

    const xmtpMessage = await conversation.send(message)
    if (previousMessages) {
      previousMessages.push({ content: message, from: 'bot' })
    }
    return xmtpMessage
  },

  sendDirectMessageWithTimeout: async (
    client: Client,
    sendTo: string,
    message: string,
    timeoutMs: number,
  ): Promise<DecodedMessage> => {
    let timeoutHandle: NodeJS.Timeout | undefined

    const timeoutPromise = new Promise<DecodedMessage>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error('Message sending timed out'))
      }, timeoutMs)
    })

    const sendMessagePromise: Promise<DecodedMessage> = sendXmtpMessage(client, sendTo, message)

    try {
      return await Promise.race([sendMessagePromise, timeoutPromise])
    } catch (error) {
      throw error
    } finally {
      clearTimeout(timeoutHandle)
    }
  },
}
