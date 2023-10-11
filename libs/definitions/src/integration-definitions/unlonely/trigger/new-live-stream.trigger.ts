import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { sendGraphqlQuery } from '@app/definitions/utils/subgraph.utils'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class NewLiveStreamTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newLiveStream'
  name = 'New Live Stream'
  description = 'Triggers when a new live stream is started'
  version = '1.0.0'
  skipAuth = true
  learnResponseWorkflow = true

  inputs: JSONSchema7 = {
    required: [],
    properties: {},
  }
  outputs: JSONSchema7 = {
    properties: {
      id: {
        type: 'string',
      },
      link: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      slug: {
        type: 'string',
      },
      owner: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
          },
          address: {
            type: 'string',
          },
        },
      },
    },
  }

  async run({ workflowOperation }: OperationRunOptions): Promise<RunResponse | null> {
    const query = `query {
      getChannelFeed(data: { isLive: true }) {
        id
        isLive
        name
        description
        slug
        owner {
          username
          address
        }
      }
    }`
    const res = await sendGraphqlQuery('https://unlonely-vqeii.ondigitalocean.app/graphql', query)
    if (!res?.data?.getChannelFeed) {
      throw new Error(`Could not fetch live streams`)
    }
    const items = res.data.getChannelFeed
    const newLives = items.filter((item: any) => !workflowOperation?.store?.liveIds?.includes(item.id))

    return {
      outputs: {
        items: newLives.map((item) => ({
          ...item,
          link: `https://www.unlonely.app/channels/${item.slug}`,
        })),
      },
      store: {
        liveIds: items.map((item: any) => item.id),
      },
    }
  }
}
