import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { PoapLib } from '../poap.lib'

export class NewPoapHolder extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newPoapHolder'
  name = 'New POAP holder'
  description = 'Triggers when any wallet collects a given POAP'
  version = '1.0.0'

  inputs: JSONSchema7 = {
    required: ['eventId'],
    properties: {
      eventId: {
        title: 'Event ID',
        type: 'string',
        description: 'The POAP event ID to watch for new holders',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'number',
      },
      owner: {
        type: 'string',
      },
      mintOrder: {
        type: 'number',
      },
      mintedAt: {
        type: 'string',
      },
      transferCount: {
        type: 'number',
      },
      // chainId: {
      //   type: 'number',
      // },
      // chainName: {
      //   type: 'string',
      // },
    },
  }

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    const { eventId } = inputs

    const tokens = fetchAll ? await PoapLib.fetchAllEventTokens(eventId) : await PoapLib.fetchLatestEventTokens(eventId)
    return {
      outputs: {
        items: tokens,
      },
    }
  }
}
