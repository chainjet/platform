import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'

export class SortListAction extends OperationOffChain {
  key = 'sortList'
  name = 'Sort List'
  description = 'Sort a given list'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['list', 'sortBy', 'direction'],
    properties: {
      list: {
        title: 'List to sort',
        type: 'string',
      },
      sortBy: {
        title: 'Sort Key',
        type: 'string',
      },
      direction: {
        title: 'Sort Direction',
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'asc',
      },
    },
  }
  learnResponseWorkflow = true

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.list || !Array.isArray(inputs.list) || !inputs.sortBy || !inputs.direction) {
      return { outputs: { sorted: [] } }
    }
    return {
      outputs: {
        sorted: inputs.list.sort((a, b) => {
          if (inputs.direction === 'asc') {
            return a[inputs.sortBy] > b[inputs.sortBy] ? 1 : -1
          } else {
            return a[inputs.sortBy] < b[inputs.sortBy] ? 1 : -1
          }
        }),
      },
    }
  }
}
