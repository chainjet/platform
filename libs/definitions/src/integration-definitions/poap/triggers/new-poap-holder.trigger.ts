import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

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

    const tokens = fetchAll ? await this.fetchAllPoaps(eventId) : await this.fetchLatestPoaps(eventId)
    return {
      outputs: {
        items: tokens,
      },
    }
  }

  async fetchLatestPoaps(eventId: string) {
    const url = `https://api.apireum.com/v1/poap/event/${eventId}/tokens?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.tokens
  }

  async fetchAllPoaps(eventId: string, page = 1) {
    const url = `https://api.apireum.com/v1/poap/event/${eventId}/tokens?key=${process.env.APIREUM_API_KEY}&sort=-mintedAt&page=${page}&limit=300`
    const res = await fetch(url)
    const data = await res.json()
    if (data.tokens && data.tokens.length >= 300) {
      return [...data.tokens, ...(await this.fetchAllPoaps(eventId, page + 1))]
    }
    return data.tokens ? data.tokens : []
  }
}
