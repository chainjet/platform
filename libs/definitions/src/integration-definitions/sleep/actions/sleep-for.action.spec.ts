import { redisForRoot } from '@app/common/utils/redis.utils'
import { Test, TestingModule } from '@nestjs/testing'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import * as chrono from 'chrono-node'
import { DefinitionsModule, IntegrationDefinitionFactory, RunResponse } from '../../..'
import { TestDatabaseModule } from '../../../../../common/test/database/test-database.module'
import { SleepDefinition } from '../sleep.definition'

describe('Sleep for action', () => {
  let definition: SleepDefinition

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, redisForRoot(), DefinitionsModule],
      providers: [SleepDefinition],
    }).compile()

    const factory = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
    definition = factory.getDefinition('sleep') as SleepDefinition
  })

  describe('run', () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date('2020-01-01 00:00:00 UTC').getTime())
      // @ts-ignore
      chrono.parseDate = jest.fn(() => new Date('2020-01-01 01:00:00 UTC'))
    })

    it('should return sleep for 1 hour', async () => {
      const opts: unknown = {
        operation: {
          key: 'sleepFor',
        },
        inputs: {
          duration: '1 hour',
        },
      }
      const res = (await definition.run(opts as OperationRunOptions)) as RunResponse
      expect(res.sleepUntil).toEqual(new Date('2020-01-01 01:00:00 UTC'))
      expect(res.outputs.sleepUntil).toEqual('2020-01-01T01:00:00.000Z')
      expect(res.outputs.sleepSeconds).toEqual(3600)
    })
  })
})
