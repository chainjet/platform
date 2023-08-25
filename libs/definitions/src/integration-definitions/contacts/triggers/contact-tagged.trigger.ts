import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class ContactTaggedTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'contactTagged'
  name = 'Contact Tagged'
  description = 'A new tag has been added to one of your contacts.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: ['tags'],
    properties: {
      tags: {
        type: 'array',
        title: 'Tags',
        items: {
          type: 'string',
        },
        description: 'Trigger the workflow when a contact is tagged with one of these tags.',
        minItems: 1,
      },
    },
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
