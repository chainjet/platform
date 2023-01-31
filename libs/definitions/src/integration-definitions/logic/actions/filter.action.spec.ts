import { StepInputs } from '@app/definitions/definition'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { FilterAction } from './filter.action'

describe('filter', () => {
  const runAction = (inputs: StepInputs): Promise<StepInputs> => {
    return new FilterAction().run({ inputs } as OperationRunOptions)
  }

  it('should return empty outputs if the filter passes', async () => {
    const inputs = {
      filters: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'foo',
        },
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, stop: false })
  })

  it('should not stop the workflow if all the filters pass', async () => {
    const inputs = {
      filters: [
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
    expect(await runAction(inputs)).toEqual({ outputs: {}, stop: false })
  })

  it('should stop the workflow if a filter is false', async () => {
    const inputs = {
      filters: [
        {
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'bar',
        },
      ],
    }
    expect(await runAction(inputs)).toEqual({ outputs: {}, stop: true })
  })

  it('should stop the workflow if one of the filters fails', async () => {
    const inputs = {
      filters: [
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
    expect(await runAction(inputs)).toEqual({ outputs: {}, stop: true })
  })
})
