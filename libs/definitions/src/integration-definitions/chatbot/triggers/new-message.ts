import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewMessageTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newChatbotMessage'
  name = 'New Chatbot Message'
  description = 'Triggers when you receive a new chatbot message.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: [],
    properties: {
      activateForKeywords: {
        type: 'boolean',
        title: 'Only activate for specific keywords',
        description: 'Whether this chatbot should be run for any keyword or only specific keywords.',
      },
      activateForNewConversations: {
        type: 'boolean',
        title: 'Only activate for new conversations',
        description: 'Whether this chatbot should be run for new conversations.',
      },
      keywords: {
        type: 'string',
        title: 'Keywords',
        description: 'Enter one or more keywords separated by commas. Keywords are case insensitive.',
      },
      tags: {
        type: 'string',
        title: 'Tags',
        description: 'Enter one or more tags separated by commas.',
      },
    },
  }
  outputs: JSONSchema7 = {
    type: 'object',
    properties: {
      // TODO
    },
  }

  async run({ inputs, credentials, workflowOperation }: OperationRunOptions): Promise<RunResponse | null> {
    return {
      outputs: {
        items: [],
      },
    }
  }
}
