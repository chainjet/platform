import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { LOGIC_FIELD_DEFS, LogicExpression, logicExpressionSatisfied } from '../logic.common'

export class FilterAction extends OperationOffChain {
  key = 'filter'
  name = 'Filter'
  description = 'Set a condition that must be met for the workflow to continue.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['filters'],
    properties: {
      filters: {
        title: 'Filters',
        type: 'array',
        items: {
          $ref: '#/$defs/Expression',
        },
        minItems: 1,
      },
    },
    $defs: LOGIC_FIELD_DEFS,
  } as JSONSchema7

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    if (inputs.filters && !Array.isArray(inputs.filters)) {
      inputs.filters = [inputs.filters]
    }
    const results = (inputs.filters ?? []).map((filter: LogicExpression) => logicExpressionSatisfied(filter))
    return {
      outputs: {},
      stop: results.includes(false),
    }
  }
}
