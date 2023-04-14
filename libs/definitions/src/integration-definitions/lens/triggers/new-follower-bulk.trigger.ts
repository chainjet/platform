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
        title: 'Lens Handle',
        type: 'string',
        description: 'The Lens handle to get the followers from. Normally this is your own handle.',
      },
    },
  }
  outputs: JSONSchema7 = {
    properties: {
      address: {
        type: 'string',
        examples: ['0x0A8e06E4e62a281A770aF8B3399D6ebF231C08d5'],
      },
      defaultProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            examples: ['0x012cd6'],
          },
          handle: {
            type: 'string',
            examples: ['chainjet.lens'],
          },
        },
      },
    },
  }

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    const { profileId } = inputs
    if (!profileId) {
      throw new Error(`Lens Handle or Profile ID required.`)
    }

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
