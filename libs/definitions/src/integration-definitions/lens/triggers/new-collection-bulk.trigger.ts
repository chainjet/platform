import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewCollectionBulkTrigger extends OperationTrigger {
  idKey = 'items[].address'
  key = 'newCollectionBulk'
  name = 'New Collection (Bulk)'
  description = 'Triggers when someone collects one of your posts or comments'
  version = '1.0.0'
  skipAuth = true
  unlisted = true

  inputs: JSONSchema7 = {
    required: ['publicationId'],
    properties: {
      publicationId: {
        title: 'Publication ID',
        type: 'string',
        description:
          'The ID of the post or comment to watch for collections. If empty, it will trigger on any collection.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      address: {
        type: 'string',
      },
      defaultProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          handle: {
            type: 'string',
          },
        },
      },
    },
  }

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    const { publicationId } = inputs
    const collections = fetchAll ? await this.fetchAll(publicationId) : await this.fetchLatest(publicationId)
    return {
      outputs: {
        items: collections,
      },
    }
  }

  async fetchLatest(publicationId: string) {
    const url = `https://api.apireum.com/v1/lens/posts/${publicationId}/collections?key=${process.env.APIREUM_API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    return data.collections
  }

  async fetchAll(publicationId: string, cursor = '') {
    const url = `https://api.apireum.com/v1/lens/posts/${publicationId}/collections?key=${process.env.APIREUM_API_KEY}&limit=50&cursor=${cursor}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.collections && data.collections.length >= 50) {
      return [...data.collections, ...(await this.fetchAll(publicationId, data.cursor))]
    }
    return data.collections ? data.collections : []
  }
}
