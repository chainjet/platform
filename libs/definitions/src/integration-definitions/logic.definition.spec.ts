import { Test, TestingModule } from '@nestjs/testing'
import { StepInputs } from '..'
import { IntegrationAction } from '../../../../apps/api/src/integration-actions/entities/integration-action'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'
import { TestDatabaseModule } from '../../../common/test/database/test-database.module'
import { DefinitionsModule } from '../definitions.module'
import { IntegrationDefinitionFactory } from '../integration-definition.factory'
import { LogicDefinition } from './logic.definition'

describe('LogicDefinition', () => {
  let definition: LogicDefinition

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, DefinitionsModule],
      providers: [LogicDefinition],
    }).compile()

    const factory = module.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
    definition = factory.getDefinition('logic') as LogicDefinition
  })

  describe('run', () => {
    describe('decision', () => {
      const getDecisionOutputs = (inputs: StepInputs): Promise<StepInputs> => {
        return definition.run({
          operation: { key: 'decision' } as IntegrationAction,
          inputs,
        } as OperationRunOptions)
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: true })
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: false })
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: true })
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: false })
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: true })
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
        expect(await getDecisionOutputs(inputs)).toEqual({ outputs: {}, condition: false })
      })
    })

    describe('assertions', () => {
      const runAssertions = (inputs: StepInputs): Promise<StepInputs> => {
        return definition.run({
          operation: { key: 'assertions' } as IntegrationAction,
          inputs,
        } as OperationRunOptions)
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
        expect(await runAssertions(inputs)).toEqual({ outputs: {} })
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
        expect(await runAssertions(inputs)).toEqual({ outputs: {} })
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
        await expect(runAssertions(inputs)).rejects.toThrow(/Assertion #1 failed. Expected "foo = bar"./)
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
        await expect(runAssertions(inputs)).rejects.toThrow(/Assertion #2 failed. Expected "300 < 8"./)
      })
    })
  })

  describe('expressionSatisfied', () => {
    it('should support the equals comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'foo',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'foo',
          comparator: '=',
          rightValue: 'BAR',
        }),
      ).toBe(false)
    })

    it('should support the not equal comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'foo',
          comparator: '!=',
          rightValue: 'BAR',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'foo',
          comparator: '!=',
          rightValue: 'foo',
        }),
      ).toBe(false)
    })

    it('should support the contains comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'contains',
          rightValue: 'test',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'contains',
          rightValue: 'something else',
        }),
      ).toBe(false)
    })

    it('should support the not contain comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!contains',
          rightValue: 'something else',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!contains',
          rightValue: 'test',
        }),
      ).toBe(false)
    })

    it('should support the startsWith comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'startsWith',
          rightValue: 'this is',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'startsWith',
          rightValue: 'a test',
        }),
      ).toBe(false)
    })

    it('should support the not startWith comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!startsWith',
          rightValue: 'a test',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!startsWith',
          rightValue: 'this is',
        }),
      ).toBe(false)
    })

    it('should support the endsWith comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'endsWith',
          rightValue: 'a test',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: 'endsWith',
          rightValue: 'this is',
        }),
      ).toBe(false)
    })

    it('should support the not endWith comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!endsWith',
          rightValue: 'this is',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 'this is a test',
          comparator: '!endsWith',
          rightValue: 'a test',
        }),
      ).toBe(false)
    })

    it('should support the greather than comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '>',
          rightValue: '3',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '>',
          rightValue: '5',
        }),
      ).toBe(false)
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '>',
          rightValue: '5',
        }),
      ).toBe(false)
    })

    it('should support the greather or equal than comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '>=',
          rightValue: '3',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '>=',
          rightValue: '5',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '>=',
          rightValue: '5',
        }),
      ).toBe(false)
    })

    it('should support the less than comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '<',
          rightValue: '5',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '<',
          rightValue: '3',
        }),
      ).toBe(false)
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '<',
          rightValue: '3',
        }),
      ).toBe(false)
    })

    it('should support the less or equal than comparator', () => {
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '<=',
          rightValue: '5',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 3,
          comparator: '<=',
          rightValue: '3',
        }),
      ).toBe(true)
      expect(
        definition.expressionSatisfied({
          leftValue: 5,
          comparator: '<=',
          rightValue: '3',
        }),
      ).toBe(false)
    })
  })
})
