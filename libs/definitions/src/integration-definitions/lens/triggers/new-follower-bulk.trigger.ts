import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { getLensProfileId } from '../lens.common'

export class NewFollowerBulkTrigger extends OperationTrigger {
  idKey = 'items[].address'
  key = 'newFollowerBulk'
  name = 'New Follower (Bulk)'
  description = 'Triggers when an account has a new follower'
  version = '1.0.0'
  skipAuth = true
  unlisted = true

  inputs: JSONSchema7 = {
    required: ['profileId'],
    properties: {
      profileId: {
        title: 'Profile ID or Handle',
        type: 'string',
        description: 'A Lens profile ID (e.g. 0x012cd6) or a Lens handle (e.g. chainjet.lens).',
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
    const { profileId } = inputs

    const lensProfileId = await getLensProfileId(profileId)

    const followers = fetchAll ? await this.fetchAll(lensProfileId) : await this.fetchLatest(lensProfileId)
    return {
      outputs: {
        items: followers.map((follower) => ({
          address: follower.id,
          defaultProfile: follower.profiles[0],
        })),
      },
    }
  }

  async fetchLatest(profileId: string) {
    const url = `https://api.apireum.com/v1/lens/followers/${profileId}?key=${process.env.APIREUM_API_KEY}&sort=-followedAt`
    const res = await fetch(url)
    const data = await res.json()
    return data.followers
  }

  async fetchAll(profileId: string, cursor = '') {
    const url = `https://api.apireum.com/v1/lens/followers/${profileId}?key=${process.env.APIREUM_API_KEY}&sort=-followedAt&cursor=${cursor}&limit=1000`
    const res = await fetch(url)
    const data = await res.json()
    if (data.followers && data.followers.length >= 1000) {
      return [...data.followers, ...(await this.fetchAll(profileId, data.cursor))]
    }
    return data.followers ? data.followers : []
  }
}
