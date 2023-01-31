import { StepInputs } from '@app/definitions/definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { AssertionsAction } from './assertions.action'

describe('assertions', () => {
  const runAction = (inputs: StepInputs): Promise<StepInputs> => {
    return new AssertionsAction().run({ inputs } as OperationRunOptions)
  }

  it('should return empty outputs if the assertion passes', async () => {
    const inputs = {
      assertions: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'foo',
        },
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {} })
  })

  it('should return empty outputs if all the assertions pass', async () => {
    const inputs = {
      assertions: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'foo',
        },
        {
          leftValue: 3,
          comparator: '<',
          rightValue: 8,
        },
        {
          leftValue: 'this is a test',
          comparator: 'contains',
          rightValue: 'test',
        },
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {} })
  })

  it('should throw an error if the assertion fails', async () => {
    const inputs = {
      assertions: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'bar',
        },
      ],
    }
    await expect(runAction(inputs)).rejects.toThrow(/Assertion #1 failed. Expected "foo = bar"./)
  })

  it('should throw an error if one of the assertions fails', async () => {
    const inputs = {
      assertions: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'foo',
        },
        {
          leftValue: 300,
          comparator: '<',
          rightValue: 8,
        },
        {
          leftValue: 'this is a test',
          comparator: 'contains',
          rightValue: 'test',
        },
      ],
    }
    await expect(runAction(inputs)).rejects.toThrow(/Assertion #2 failed. Expected "300 < 8"./)
  })
})
