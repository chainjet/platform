import { logicExpressionSatisfied } from './logic.common'

describe('logicExpressionSatisfied', () => {
  it('should support the equals comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'foo',
        comparator: '=',
        rightValue: 'foo',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'foo',
        comparator: '=',
        rightValue: 'BAR',
      }),
    ).toBe(false)
  })

  it('should support the not equal comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'foo',
        comparator: '!=',
        rightValue: 'BAR',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'foo',
        comparator: '!=',
        rightValue: 'foo',
      }),
    ).toBe(false)
  })

  it('should support the contains comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'contains',
        rightValue: 'test',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'contains',
        rightValue: 'something else',
      }),
    ).toBe(false)
  })

  it('should support the not contain comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!contains',
        rightValue: 'something else',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!contains',
        rightValue: 'test',
      }),
    ).toBe(false)
  })

  it('should support the startsWith comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'startsWith',
        rightValue: 'this is',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'startsWith',
        rightValue: 'a test',
      }),
    ).toBe(false)
  })

  it('should support the not startWith comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!startsWith',
        rightValue: 'a test',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!startsWith',
        rightValue: 'this is',
      }),
    ).toBe(false)
  })

  it('should support the endsWith comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'endsWith',
        rightValue: 'a test',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: 'endsWith',
        rightValue: 'this is',
      }),
    ).toBe(false)
  })

  it('should support the not endWith comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!endsWith',
        rightValue: 'this is',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 'this is a test',
        comparator: '!endsWith',
        rightValue: 'a test',
      }),
    ).toBe(false)
  })

  it('should support the greather than comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '>',
        rightValue: '3',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '>',
        rightValue: '5',
      }),
    ).toBe(false)
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '>',
        rightValue: '5',
      }),
    ).toBe(false)
  })

  it('should support the greather or equal than comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '>=',
        rightValue: '3',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '>=',
        rightValue: '5',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '>=',
        rightValue: '5',
      }),
    ).toBe(false)
  })

  it('should support the less than comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '<',
        rightValue: '5',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '<',
        rightValue: '3',
      }),
    ).toBe(false)
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '<',
        rightValue: '3',
      }),
    ).toBe(false)
  })

  it('should support the less or equal than comparator', () => {
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '<=',
        rightValue: '5',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 3,
        comparator: '<=',
        rightValue: '3',
      }),
    ).toBe(true)
    expect(
      logicExpressionSatisfied({
        leftValue: 5,
        comparator: '<=',
        rightValue: '3',
      }),
    ).toBe(false)
  })
})
