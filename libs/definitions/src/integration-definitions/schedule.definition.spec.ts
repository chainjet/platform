import { Test, TestingModule } from '@nestjs/testing'
import { DefinitionsModule, IntegrationDefinitionFactory } from '..'
import { TestDatabaseModule } from '../../../common/test/database/test-database.module'
import { ScheduleDefinition } from './schedule.definition'

describe('Schedule Definition', () => {
  let definition: ScheduleDefinition

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, DefinitionsModule],
      providers: [ScheduleDefinition],
    }).compile()

    const factory = module.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
    definition = factory.getDefinition('schedule') as ScheduleDefinition
  })

  describe('Run', () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date('2020-01-01 00:00').getTime())
    })

    it('should return the current date', async () => {
      expect(await definition.run()).toEqual({
        outputs: {
          date: 'Wednesday 01, 2020',
          dayName: 'Wednesday',
          dayOfMonth: 1,
          hour: 0,
          isoString: new Date('2020-01-01 00:00').toISOString(),
          minute: 0,
          monthName: 'January',
          monthNumber: 1,
          second: 0,
          time: '00:00:00',
          timezoneOffset: new Date('2020-01-01 00:00').getTimezoneOffset(),
          unixtime: 1577847600000,
          year: 2020,
        },
      })
    })
  })
})
