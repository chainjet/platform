import { RunResponse } from '@app/definitions/definition'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { BadRequestException } from '@nestjs/common'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class NewItemInGraphqlQueryTrigger extends OperationTrigger {
  idKey = 'items[].id'
  key = 'newItemInGraphqlQuery'
  name = 'New Item In GraphQL Query'
  description = 'Triggers when there is a new item in a GraphQL query'
  version = '1.0.0'
  skipAuth = true
  learnResponseWorkflow = true

  inputs: JSONSchema7 = {
    required: ['url', 'query', 'itemIdKey'],
    properties: {
      url: {
        title: 'GraphQL endpoint',
        type: 'string',
        format: 'uri',
      },
      query: {
        type: 'string',
        'x-ui:widget': 'textarea',
        title: 'GraphQL query',
      } as JSONSchema7Definition,
      itemIdKey: {
        title: 'Item ID Key',
        type: 'string',
        description: 'The key representing the item ID in the GraphQL query',
        default: 'id',
      },
    },
  }
  outputs: JSONSchema7 = {}

  async run({ inputs, fetchAll }: OperationRunOptions): Promise<RunResponse | null> {
    if (!inputs.itemIdKey) {
      inputs.itemIdKey = 'id'
    }
    const res = await fetch(inputs.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: inputs.query }),
    })
    const json = await res.json()
    if (!json?.data) {
      throw new BadRequestException(`No data found in GraphQL response`)
    }
    const keys = Object.keys(json.data)
    if (keys.length !== 1) {
      throw new BadRequestException(`GraphQL query must fetch exactly one object type, got ${keys.length}.`)
    }
    if (!Array.isArray(json.data[keys[0]])) {
      throw new BadRequestException(`GraphQL query must fetch a list of items, got ${typeof json.data[keys[0]]}.`)
    }
    return {
      outputs: {
        items: json.data[keys[0]].map((item) => ({ id: item[inputs.itemIdKey], data: item })),
      },
    }
  }
}
