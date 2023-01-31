export interface LogicExpression {
  leftValue: any
  comparator: string
  rightValue: any
}

export const LOGIC_FIELD_DEFS = {
  Expression: {
    type: 'object',
    required: ['comparator'],
    properties: {
      leftValue: { title: 'Value', type: 'string' },
      comparator: {
        title: 'Comparator',
        type: 'string',
        oneOf: [
          { title: 'Equals', 'x-const': '=' },
          { title: 'Not Equal', 'x-const': '!=' },
          { title: 'Contains', 'x-const': 'contains' },
          { title: 'Not Contain', 'x-const': '!contains' },
          { title: 'Starts With', 'x-const': 'startsWith' },
          { title: 'Not Start With', 'x-const': '!startsWith' },
          { title: 'Ends With', 'x-const': 'endsWith' },
          { title: 'Not End With', 'x-const': '!endsWith' },
          { title: 'Greather Than', 'x-const': '>' },
          { title: 'Greather or Equal Than', 'x-const': '>=' },
          { title: 'Less Than', 'x-const': '<' },
          { title: 'Less or Equal Than', 'x-const': '<=' },
        ],
      },
      rightValue: { title: 'Value', type: 'string' },
    },
  },
  AndExpressions: {
    type: 'array',
    items: { $ref: '#/$defs/Expression' },
    minItems: 1,
    maxItems: 1,
  },
  OrExpressions: {
    type: 'array',
    items: { $ref: '#/$defs/AndExpressions' },
    minItems: 1,
    maxItems: 1,
  },
}

export function logicExpressionSatisfied(expression: LogicExpression): boolean {
  const { comparator } = expression
  const comparatorNegated = comparator.startsWith('!')
  const expressionValue = logicEvaluateNotNegatedCondition({
    ...expression,
    comparator: comparatorNegated ? comparator.slice(1) : comparator,
  })
  return comparatorNegated ? !expressionValue : expressionValue
}

export function logicEvaluateNotNegatedCondition(expression: LogicExpression): boolean {
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
