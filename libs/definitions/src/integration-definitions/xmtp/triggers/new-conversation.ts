import { AuthenticationError } from '@app/common/errors/authentication-error'
import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { XmtpLib } from '../xmtp.lib'

export class NewConversationTrigger extends OperationTrigger {
  idKey = 'items[].id'
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
      throw new AuthenticationError(`Missing keys for XMTP`)
    }
    const client = await XmtpLib.getClient(credentials.keys)
    const conversations = await client.conversations.list()
    await client.close()
    return {
      outputs: {
        items: conversations
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((conversation) => ({
            id: conversation.context?.conversationId ?? conversation.peerAddress,
            conversationId: conversation.context?.conversationId,
            topic: conversation.topic,
            createdAt: conversation.createdAt,
            peerAddress: conversation.peerAddress,
          })),
      },
    }
  }
}
