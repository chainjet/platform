import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewContactTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newContactTrigger'
  name = 'New Contact'
  description = 'A new contact has been added on your ChainJet account.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: [],
    properties: {},
  }
  outputs: JSONSchema7 = {
    properties: {
      contact: {
        type: 'object',
        'x-type': 'contact',
      } as JSONSchema7,
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
