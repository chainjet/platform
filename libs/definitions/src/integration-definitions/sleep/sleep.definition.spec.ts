import { Test, TestingModule } from '@nestjs/testing'
import { DefinitionsModule, IntegrationDefinitionFactory } from '../..'
import { OperationRunOptions } from '../../../../../apps/runner/src/services/operation-runner.service'
import { TestDatabaseModule } from '../../../../common/test/database/test-database.module'
import { SleepDefinition } from './sleep.definition'

describe('Sleep definition', () => {
  let definition: SleepDefinition

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, DefinitionsModule],
      providers: [SleepDefinition],
    }).compile()

    const factory = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
    definition = factory.getDefinition('sleep') as SleepDefinition
  })

  describe('run sleepFor', () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date('2020-01-01 00:00:00').getTime())
    })

    it('should return sleepUntil a given number of seconds', async () => {
      const opts: unknown = {
        operation: {
          key: 'sleepFor',
        },
        inputs: {
          amount: 30,
          unit: 'seconds',
        },
      }
      const res = await definition.run(opts as OperationRunOptions)
      expect(res.sleepUntil).toEqual(new Date('2020-01-01 00:00:30'))
    })

    it('should return sleepUntil a given number of minutes', async () => {
      const opts: unknown = {
        operation: {
          key: 'sleepFor',
        },
        inputs: {
          amount: 5,
          unit: 'minutes',
        },
      }
      const res = await definition.run(opts as OperationRunOptions)
      expect(res.sleepUntil).toEqual(new Date('2020-01-01 00:05:00'))
    })

    it('should return sleepUntil a given number of hours', async () => {
      const opts: unknown = {
        operation: {
          key: 'sleepFor',
        },
        inputs: {
          amount: 3,
          unit: 'hours',
        },
      }
      const res = await definition.run(opts as OperationRunOptions)
      expect(res.sleepUntil).toEqual(new Date('2020-01-01 03:00:00'))
    })

    it('should return sleepUntil a given number of days', async () => {
      const opts: unknown = {
        operation: {
          key: 'sleepFor',
        },
        inputs: {
          amount: 15,
          unit: 'days',
        },
      }
      const res = await definition.run(opts as OperationRunOptions)
      expect(res.sleepUntil).toEqual(new Date('2020-01-16 00:00:00'))
    })
  })
})
