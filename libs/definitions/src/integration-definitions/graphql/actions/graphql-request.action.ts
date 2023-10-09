import { RunResponse } from '@app/definitions/definition'
import { OperationAction } from '@app/definitions/opertion-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7, JSONSchema7Definition } from 'json-schema'

export class GraphQLRequestAction extends OperationAction {
  key = 'graphqlRequest'
  name = 'GraphQL Request'
  description = 'Make a GraphQL API request'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['url', 'query'],
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
    },
  }
  outputs: JSONSchema7 = {}
  learnResponseWorkflow = true

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const res = await fetch(inputs.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query: inputs.query }),
    })
    return {
      outputs: await res.json(),
    }
  }
}
