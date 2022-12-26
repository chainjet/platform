import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { Client } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewConversationTrigger extends OperationTrigger {
  idKey = 'items[].conversationId'
  key = 'newConversation'
  name = 'New Conversation'
  description =
    'Triggers when a new conversation is created. A conversation is the first message between two addresses.'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: [],
    properties: {},
  }
  outputs: JSONSchema7 = {
    properties: {
      conversationId: {
        title: 'Conversation ID',
        type: 'string',
      },
      topic: {
        type: 'string',
      },
      createdAt: {
        type: 'string',
      },
      peerAddress: {
        type: 'string',
      },
    },
  }

  async run({ inputs, credentials }: OperationRunOptions): Promise<RunResponse | null> {
    if (!credentials.keys) {
      throw new Error(`Missing keys for XMTP`)
    }
    const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
    const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })
    const conversations = await client.conversations.list()
    await client.close()
    return {
      outputs: {
        items: conversations
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .filter((conversation) => !!conversation.context?.conversationId)
          .map((conversation) => ({
            conversationId: conversation.context!.conversationId,
            topic: conversation.topic,
            createdAt: conversation.createdAt,
            peerAddress: conversation.peerAddress,
          })),
      },
    }
  }
}
