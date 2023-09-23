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
      contentIncludes: {
        type: 'string',
        title: 'Message Content Includes:',
        description: 'Only trigger if the message you send contains this text. This is case insensitive.',
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
