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
      address: {
        type: 'string',
        title: 'Wallet Address',
        examples: ['0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'],
      },
      walletName: {
        type: 'string',
        title: 'Wallet Name',
        examples: ['vitalik.eth'],
      },
      ens: {
        type: 'string',
        title: 'ENS Name',
        examples: ['vitalik.eth'],
      },
      lens: {
        type: 'string',
        title: 'Lens Profile',
        examples: ['vitalik.lens'],
      },
      farcaster: {
        type: 'string',
        title: 'Farcaster Profile',
        examples: ['vitalik.eth'],
      },
      tags: {
        type: 'array',
        title: 'Tags',
        items: {
          type: 'string',
        },
        examples: [['Chatbot', 'Eth Paris', 'Eth NYC']],
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
