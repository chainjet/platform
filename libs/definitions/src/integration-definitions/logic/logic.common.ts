export interface LogicExpression {
  leftValue: any
  comparator: string
  rightValue: any
}

export const LOGIC_COMPARATORS = [
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
  { title: 'Text Length Greather Than', 'x-const': 'length>' },
  { title: 'Text Length Less Than', 'x-const': 'length<' },
]

export const LOGIC_FIELD_DEFS = {
  Expression: {
    type: 'object',
    required: ['comparator'],
    properties: {
      leftValue: { title: 'Value', type: 'string' },
      comparator: {
        title: 'Comparator',
        type: 'string',
        oneOf: LOGIC_COMPARATORS,
      },
      rightValue: { title: 'Value', type: 'string' },
    },
  },
  AndExpressions: {
    type: 'array',
    items: { $ref: '#/$defs/Expression' },
    minItems: 1,
    'x-addLabel': 'And',
  },
  OrExpressions: {
    type: 'array',
    items: { $ref: '#/$defs/AndExpressions' },
    minItems: 1,
    'x-addLabel': 'Or',
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
    case 'length>':
      return `${leftValue}`.length > Number(rightValue)
    case 'length<':
      return `${leftValue}`.length < Number(rightValue)
    default:
      throw new Error(`Unknown expression comparator ${comparator}`)
  }
}

export function expressionsToQuery(orExpressions: LogicExpression[][]): any {
  // If there's only one `orExpression` and one condition inside it
  if (orExpressions.length === 1 && orExpressions[0].length === 1) {
    return expressionToQuery(orExpressions[0][0])
  }

  // If there's only one group of `andExpressions`, no need for `$or`
  if (orExpressions.length === 1) {
    return { $and: orExpressions[0].map((expression) => expressionToQuery(expression)) }
  }

  // Return the general structure otherwise
  return {
    $or: orExpressions.map((andExpressions) => {
      // If there's only one condition inside an `andExpressions` group, no need for `$and`
      if (andExpressions.length === 1) {
        return expressionToQuery(andExpressions[0])
      }
      return { $and: andExpressions.map((expression) => expressionToQuery(expression)) }
    }),
  }
}

export function expressionToQuery(expression: LogicExpression): any {
  const { leftValue, comparator, rightValue } = expression
  switch (comparator) {
    case '=':
      return { [leftValue]: rightValue }
    case '!=':
      return { [leftValue]: { $ne: rightValue } }
    case 'contains':
      return { [leftValue]: { $regex: rightValue, $options: 'i' } }
    case '!contains':
      return { [leftValue]: { $not: { $regex: rightValue, $options: 'i' } } }
    case 'startsWith':
      return { [leftValue]: { $regex: `^${rightValue}`, $options: 'i' } }
    case '!startsWith':
      return { [leftValue]: { $not: { $regex: `^${rightValue}`, $options: 'i' } } }
    case 'endsWith':
      return { [leftValue]: { $regex: `${rightValue}$`, $options: 'i' } }
    case '!endsWith':
      return { [leftValue]: { $not: { $regex: `${rightValue}$`, $options: 'i' } } }
    case '>':
      return { [leftValue]: { $gt: Number(rightValue) } }
    case '>=':
      return { [leftValue]: { $gte: Number(rightValue) } }
    case '<':
      return { [leftValue]: { $lt: Number(rightValue) } }
    case '<=':
      return { [leftValue]: { $lte: Number(rightValue) } }
    case 'length>':
      return { [leftValue]: { $where: `this.${leftValue}.length > ${Number(rightValue)}` } }
    case 'length<':
      return { [leftValue]: { $where: `this.${leftValue}.length < ${Number(rightValue)}` } }
    default:
      throw new Error(`Unknown expression comparator ${comparator}`)
  }
}
