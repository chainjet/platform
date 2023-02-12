import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class ForEachAction extends OperationOffChain {
  key = 'forEach'
  name = 'For Each'
  description = 'Execute the subsequent actions for each element in a list.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['items'],
    properties: {
      items: {
        title: 'Items',
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
    },
  } as JSONSchema7
  learnResponseWorkflow = true

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (!Array.isArray(inputs.items)) {
      throw new Error('Items must be an array')
    }
    const items = inputs.items.reduce((acc, item) => {
      if (Array.isArray(item)) {
        return acc.concat(item.map((i) => ({ item: i })))
      }
      acc.push({ item })
      return acc
    }, [])
    return {
      outputs: {
        items,
      },
      repeatKey: 'items',
    }
  }
}
