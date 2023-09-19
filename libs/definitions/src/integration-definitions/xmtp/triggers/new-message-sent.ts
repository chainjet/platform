import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { xmtpMessageSchema } from '../xmtp.common'

export class NewMessageSentTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newMessageSent'
  name = 'New Message Sent'
  description = 'Triggers when you send a new message.'
  version = '1.0.0'
  triggerInstant = true

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

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    return {
      outputs: {
        items: [],
      },
    }
  }
}
