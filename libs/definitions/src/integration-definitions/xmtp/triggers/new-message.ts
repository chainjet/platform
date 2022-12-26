import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { Client, DecodedMessage } from '@xmtp/xmtp-js'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { mapXmtpMessageToOutput, xmtpMessageSchema } from '../xmtp.common'

export class NewMessageTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newMessage'
  name = 'New Message'
  description = 'Triggers when you receive a new message.'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: [],
    properties: {
      conversationPrefix: {
        type: 'string',
        title: 'Conversation prefix',
        description:
          'Only trigger on messages from conversation Ids that start with this value. Leave blank to trigger on all messages. (i.e. "lens.dev/dm/")',
      },
    },
  }
  outputs: JSONSchema7 = {
    ...xmtpMessageSchema,
  }

  async run({ inputs, credentials, workflowOperation }: OperationRunOptions): Promise<RunResponse | null> {
    if (!credentials.keys) {
      throw new Error(`Missing keys for XMTP`)
    }
    const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
    const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })
    let conversations = (await client.conversations.list()).reverse()

    // filter conversations starting with the given prefix
    if (inputs.conversationPrefix) {
      conversations = conversations.filter((conversation) =>
        conversation.context?.conversationId.startsWith(inputs.conversationPrefix),
      )
    }

    const lastFetch: Date | undefined =
      workflowOperation?.store?.lastFetch && new Date(workflowOperation.store.lastFetch)

    const allMessages: DecodedMessage[] = []
    for (const conversation of conversations) {
      const messages = await conversation.messages({
        ...(lastFetch ? { startTime: lastFetch } : {}),
      })
      allMessages.push(...messages.filter((message) => message.senderAddress !== client.address))
    }

    await client.close()

    // give a 15 minute buffer to avoid missing messages
    const newLastFetch = new Date()
    newLastFetch.setMinutes(newLastFetch.getMinutes() - 15)

    return {
      outputs: {
        items: allMessages
          .map((message) => mapXmtpMessageToOutput(message))
          .sort((a, b) => new Date(b.sent).getTime() - new Date(a.sent).getTime()),
      },
      store: {
        lastFetch: newLastFetch.toISOString(),
      },
    }
  }
}
