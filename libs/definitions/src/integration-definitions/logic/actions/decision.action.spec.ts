import { StepInputs } from '@app/definitions/definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { DecisionAction } from './decision.action'

describe('decision', () => {
  const runAction = (inputs: StepInputs): Promise<StepInputs> => {
    return new DecisionAction().run({ inputs } as OperationRunOptions)
  }

  it('should return true if a simple condition is met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'foo',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: true })
  })

  it('should return false if a simple condition is not met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'BAR',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: false })
  })

  it('should return true if all AND conditions are met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'foo',
          },
          {
            leftValue: 'foo 2',
            comparator: '=',
            rightValue: 'foo 2',
          },
          {
            leftValue: 'foo 3',
            comparator: '=',
            rightValue: 'foo 3',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: true })
  })

  it('should return false if one AND condition is not met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'foo',
          },
          {
            leftValue: 'foo 2',
            comparator: '=',
            rightValue: 'BAR',
          },
          {
            leftValue: 'foo 3',
            comparator: '=',
            rightValue: 'foo 3',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: false })
  })

  it('should return true if at least one OR condition is met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'BAR',
          },
        ],
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'foo',
          },
        ],
        [
          {
            leftValue: 'BAR',
            comparator: '=',
            rightValue: 'foo',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: true })
  })

  it('should return false if none OR condition is met', async () => {
    const inputs = {
      expression: [
        [
          {
            leftValue: 'foo',
            comparator: '=',
            rightValue: 'BAR',
          },
        ],
        [
          {
            leftValue: 'BAR',
            comparator: '=',
            rightValue: 'foo',
          },
        ],
        [
          {
            leftValue: 'FOO BAR',
            comparator: '=',
            rightValue: 'foo',
          },
        ],
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, condition: false })
  })
})
