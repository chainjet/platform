import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewMentionChainJetBotTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newMentionToChainJetBot'
  name = 'New Mention to @ChainJetBot.lens'
  description = 'Triggers when you mention @ChainJetBot.lens in a post or comment'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    properties: {
      startsWith: {
        title: 'Mention starts with',
        type: 'string',
        description:
          'Only trigger for mentions that start with this string. For instance, if you enter `notion`, it will trigger for the post `@ChainJetBot notion` or `@ChainJetBot notion is cool`.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      mention: {
        type: 'string',
      },
      fullContent: {
        type: 'string',
      },
      mainPost: {
        type: 'string',
      },
    },
  }

  async run({ inputs, credentials, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error('Instant triggers cannot be executed directly')
  }
}
