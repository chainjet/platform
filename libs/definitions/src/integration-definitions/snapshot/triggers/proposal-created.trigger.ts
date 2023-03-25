import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { SNAPSHOT_PROPOSAL_SCHEMA } from '../snapshot.commons'

export class ProposalCreated extends OperationTrigger {
  idKey = ''
  key = 'proposalCreated'
  name = 'Proposal Created'
  description = 'Triggers when a new proposal is created.'
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
  outputs: JSONSchema7 = SNAPSHOT_PROPOSAL_SCHEMA

  async run({}: OperationRunOptions): Promise<RunResponse | null> {
    throw new Error('Cannot run an instant trigger')
  }
}
