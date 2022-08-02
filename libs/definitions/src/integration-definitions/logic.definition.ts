import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { SingleIntegrationDefinition } from '../single-integration.definition'

interface Expression {
  leftValue: any
  comparator: string
  rightValue: any
}
export class LogicDefinition extends SingleIntegrationDefinition {
  readonly integrationKey = 'logic'
  readonly integrationVersion = '1'
  readonly schemaUrl = null

  async run(opts: OperationRunOptions): Promise<RunResponse> {
    switch (opts.operation.key) {
      case 'decision':
        return this.runDecisionAction(opts)
      case 'assertions':
        return this.runAssertionsAction(opts)
    }
    throw new Error('Unknown logic operation')
  }

  protected runDecisionAction({ inputs }: OperationRunOptions): RunResponse {
    const condition = (inputs.expression ?? []).some((orExpression) =>
      orExpression.every((expression: Expression) => this.expressionSatisfied(expression)),
    )
    return {
      outputs: {},
      condition,
    }
  }

  /**
   * Throws an error if one of the assertions fail
   */
  protected runAssertionsAction({ inputs }: OperationRunOptions): RunResponse {
    const results = (inputs.assertions ?? []).map((assertion: Expression) => this.expressionSatisfied(assertion))
    const failedAssertionIndex: number = results.indexOf(false)
    if (failedAssertionIndex > -1) {
      const failedAssertion: Expression = inputs.assertions[failedAssertionIndex]
      const expectation = `${failedAssertion.leftValue} ${failedAssertion.comparator} ${failedAssertion.rightValue}`
      throw new Error(`Assertion #${failedAssertionIndex + 1} failed. Expected "${expectation}".`)
    }
    return {
      outputs: {},
    }
  }

  expressionSatisfied(expression: Expression): boolean {
    const { comparator } = expression
    const comparatorNegated = comparator.startsWith('!')
    const expressionValue = this.evaluateNotNegatedCondition({
      ...expression,
      comparator: comparatorNegated ? comparator.slice(1) : comparator,
    })
    return comparatorNegated ? !expressionValue : expressionValue
  }

  evaluateNotNegatedCondition(expression: Expression): boolean {
    const { leftValue, comparator, rightValue } = expression
    switch (comparator) {
      case '=':
        return `${leftValue}` === `${rightValue}`
      case 'contains':
        return leftValue.includes(rightValue)
      case 'startsWith':
        return leftValue.toString().startsWith(rightValue.toString())
      case 'endsWith':
        return leftValue.toString().endsWith(rightValue.toString())
      case '>':
        return Number(leftValue) > Number(rightValue)
      case '>=':
        return Number(leftValue) >= Number(rightValue)
      case '<':
        return Number(leftValue) < Number(rightValue)
      case '<=':
        return Number(leftValue) <= Number(rightValue)
    }
    throw new Error(`Unknown expression comparator ${comparator}`)
  }
}
