import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class ProposalDeleted extends OperationTrigger {
  idKey = ''
  key = 'proposalDeleted'
  name = 'Proposal Deleted'
  description = 'Triggers when a proposal is deleted by the author or an admin of the space.'
  version = '1.0.0'
  triggerInstant = true

  inputs: JSONSchema7 = {
    required: ['space'],
    properties: {
      space: {
        title: 'Space ENS',
        type: 'string',
        description: 'The ENS of the space to listen to',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: { type: 'string' },
      space: { type: 'string' },
      expire: { type: 'number' },
    },
  }

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error('Cannot run an instant trigger')
  }
}
