import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { LensLib } from '../lens.lib'

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
    const collections = fetchAll
      ? await LensLib.fetchAllCollectors(publicationId)
      : await LensLib.fetchLatestCollectors(publicationId)
    return {
      outputs: {
        items: collections,
      },
    }
  }
}
