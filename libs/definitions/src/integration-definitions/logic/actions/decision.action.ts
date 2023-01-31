import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { LogicExpression, logicExpressionSatisfied, LOGIC_FIELD_DEFS } from '../logic.common'

export class DecisionAction extends OperationOffChain {
  key = 'decision'
  name = 'Decision'
  description = 'Conditionally choose between two paths.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['expression'],
    properties: {
      expression: {
        title: 'Expression',
        $ref: '#/$defs/OrExpressions',
      },
    },
    $defs: LOGIC_FIELD_DEFS,
  } as JSONSchema7

  async run({ inputs }: OperationRunOptions): Promise<RunResponse> {
    const condition = (inputs.expression ?? []).some((orExpression) =>
      orExpression.every((expression: LogicExpression) => logicExpressionSatisfied(expression)),
    )
    return {
      outputs: {},
      condition,
    }
  }
}
