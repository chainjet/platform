import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewChatbotMessageTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newChatbotMessage'
  name = 'New Message'
  description = 'Triggers when you receive a new chatbot message.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: [],
    properties: {
      activateOncePerContact: {
        type: 'boolean',
        title: 'Only activate once per contact',
        description: 'Whether this chatbot should be run only once per wallet.',
      },
      keywords: {
        type: 'string',
        title: 'Keywords',
        description:
          'Only activate this chatbot when the user sends one of these keywords. Enter one or more keywords separated by commas. Leave blank to activate on any message.',
      },
      tags: {
        type: 'string',
        title: 'Tags',
        description: 'Tag contacts who message this chatbot. Enter one or more tags separated by commas.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        title: 'Message ID',
        type: 'string',
      },
      content: {
        type: 'string',
      },
      sent: {
        type: 'string',
      },
      conversation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
          },
        },
      },
    },
  }

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    return {
      outputs: {
        items: [],
      },
    }
  }
}
