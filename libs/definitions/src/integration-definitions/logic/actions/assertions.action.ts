import { RunResponse } from '@app/definitions/definition'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { JSONSchema7 } from 'json-schema'
import { LogicExpression, logicExpressionSatisfied, LOGIC_FIELD_DEFS } from '../logic.common'

export class AssertionsAction extends OperationOffChain {
  key = 'assertions'
  name = 'Assertions'
  description = 'Fail the workflow if one or more conditions are not satisfied.'
  version = '1.0.0'
  inputs: JSONSchema7 = {
    required: ['assertions'],
    properties: {
      assertions: {
        title: 'Assertions',
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
    const results = (inputs.assertions ?? []).map((assertion: LogicExpression) => logicExpressionSatisfied(assertion))
    const failedAssertionIndex: number = results.indexOf(false)
    if (failedAssertionIndex > -1) {
      const failedAssertion: LogicExpression = inputs.assertions[failedAssertionIndex]
      const expectation = `${failedAssertion.leftValue} ${failedAssertion.comparator} ${failedAssertion.rightValue}`
      throw new Error(`Assertion #${failedAssertionIndex + 1} failed. Expected "${expectation}".`)
    }
    return {
      outputs: {},
    }
  }
}
