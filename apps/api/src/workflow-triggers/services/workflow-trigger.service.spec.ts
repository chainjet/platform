import { IntegrationDefinitionFactory } from '@app/definitions'
import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { HooksController } from '../controllers/hooks.controller'
import { WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from './workflow-trigger.service'

describe('WorkflowTriggerService', () => {
  let service: WorkflowTriggerService
  let mock: MockService
  let integrationDefinitionFactory: IntegrationDefinitionFactory

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([WorkflowTrigger]), MockModule],
      providers: [WorkflowTriggerService, HooksController],
    }).compile()

    service = testModule.get<WorkflowTriggerService>(WorkflowTriggerService)
    mock = testModule.get<MockService>(MockService)
    integrationDefinitionFactory = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
  })

  beforeEach(async () => {
    integrationDefinitionFactory.getDefinition = jest.fn(() => mock.getDefinition({}))
    await mock.createUser()
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('updateOne', () => {
    it('should update nextCheck if frequency is updated', async () => {
      const nextCheck = new Date('01/01/2020 00:00:00 UTC')
      const trigger = await mock.createWorkflowTriggerDeep({
        nextCheck,
        schedule: {
          frequency: 'interval',
          interval: 120,
        },
      })
      await service.updateOne(trigger.id, {
        schedule: {
          frequency: 'interval',
          interval: 600,
        },
      })
      const updated = await service.findById(trigger.id)
      expect(updated?.nextCheck?.getTime()).toBeGreaterThan(Date.now())
    })

    it('should not update nextCheck if frequency is not updated', async () => {
      const nextCheck = new Date('01/01/2020 00:00:00 UTC')
      const trigger = await mock.createWorkflowTriggerDeep({
        nextCheck,
        schedule: {
          frequency: 'interval',
          interval: 120,
        },
      })
      await service.updateOne(trigger.id, { inputs: {} })
      const updated = await service.findById(trigger.id)
      expect(updated?.nextCheck?.getTime()).toBe(trigger.nextCheck?.getTime())
    })

    it('should update nextCheck if enabled was changed to true', async () => {
      const trigger = await mock.createWorkflowTriggerDeep({
        enabled: false,
        nextCheck: undefined,
        schedule: {
          frequency: 'interval',
          interval: 120,
        },
      })
      await service.updateOne(trigger.id, { enabled: true })
      const updated = await service.findById(trigger.id)
      expect(updated?.nextCheck?.getTime()).toBeGreaterThan(Date.now())
    })

    it('should remove nextCheck if enabled was changed to false', async () => {
      const trigger = await mock.createWorkflowTriggerDeep({
        enabled: true,
        nextCheck: new Date('2100-01-01 UTC'),
        schedule: {
          frequency: 'interval',
          interval: 120,
        },
      })
      await service.updateOne(trigger.id, { enabled: false })
      const updated = await service.findById(trigger.id)
      expect(updated?.nextCheck).toBeNull()
    })
  })

  describe('getTriggerNextCheck', () => {
    beforeEach(() => {
      Date.now = jest.fn(() => new Date('01/01/2020').getTime())
    })

    it('should return null if the trigger does not have schedule', () => {
      const trigger = mock.getInstanceOfWorkflowTrigger()
      expect(service.getTriggerNextCheck(trigger)).toBeNull()
    })

    it('should return null if the trigger is not enabled', () => {
      const trigger = mock.getInstanceOfWorkflowTrigger({
        schedule: {
          frequency: 'once',
          datetime: new Date('2100-01-01 UTC').toISOString(),
        },
        enabled: false,
      })
      expect(service.getTriggerNextCheck(trigger)).toBeNull()
    })

    describe('once', () => {
      it('should return the next check for a date in the future', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'once',
            datetime: new Date('2100-01-01 UTC').toISOString(),
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2100-01-01 UTC'))
      })

      it('should return null for a date in the past', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'once',
            datetime: new Date('2019-01-01').toISOString(),
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toBeNull()
      })

      it('should throw an error if date is invalid', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'once',
            datetime: 'invalid date',
          },
        })
        expect(() => service.getTriggerNextCheck(trigger)).toThrow(/Date is not valid/)
      })
    })

    describe('interval', () => {
      it('should increse current date by the interval if trigger does not have next check', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'interval',
            interval: 300,
          },
        })
        expect(service.getTriggerNextCheck(trigger, true)).toEqual(new Date('2020-01-01 00:05'))
        expect(service.getTriggerNextCheck(trigger, false)).toEqual(new Date('2020-01-01 00:05'))
      })

      it('should increse current date by the interval if next check + interval is in the past', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'interval',
            interval: 300,
          },
          nextCheck: new Date('2019-01-01'),
        })
        expect(service.getTriggerNextCheck(trigger, true)).toEqual(new Date('2020-01-01 00:05'))
        expect(service.getTriggerNextCheck(trigger, false)).toEqual(new Date('2020-01-01 00:05'))
      })

      it('should increase next check by the interval only if the schedule did not change', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'interval',
            interval: 300,
          },
          nextCheck: new Date('2020-02-02 13:00'),
        })
        expect(service.getTriggerNextCheck(trigger, true)).toEqual(new Date('2020-01-01 00:05'))
        expect(service.getTriggerNextCheck(trigger, false)).toEqual(new Date('2020-02-02 13:05'))
      })
    })

    describe('hour', () => {
      it('should return the same hour on the given minute', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'hour',
            minute: 22,
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-01 00:22'))
      })

      it('should return the next hour on the given minute', () => {
        Date.now = jest.fn(() => new Date('2020-01-01 00:30').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'hour',
            minute: 22,
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-01 01:22'))
      })
    })

    describe('day', () => {
      it('should return the same day on the given hour', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'day',
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-01 12:23'))
      })

      it('should return the next day on the given hour', () => {
        Date.now = jest.fn(() => new Date('2020-01-01 16:00').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'day',
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-02 12:23'))
      })

      it('should throw an error if time is invalid', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'day',
            time: 'invalid time',
          },
        })
        expect(() => service.getTriggerNextCheck(trigger)).toThrow(/Time is not valid/)
      })
    })

    describe('week', () => {
      it('should return the same week on the given date', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'week',
            dayOfWeek: 5,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-03 12:23'))
      })

      it('should return the next week on the given date if the time is higher', () => {
        Date.now = jest.fn(() => new Date('2020-01-05 16:00').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'week',
            dayOfWeek: 5,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-10 12:23'))
      })

      it('should return the next week on the given date if the day is higher', () => {
        Date.now = jest.fn(() => new Date('2020-01-06 00:00').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'week',
            dayOfWeek: 5,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-10 12:23'))
      })
    })

    describe('month', () => {
      it('should return the same week on the given date', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'month',
            dayOfMonth: 12,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-12 12:23'))
      })

      it('should return the next week on the given date if time is higher', () => {
        Date.now = jest.fn(() => new Date('2020-01-12 16:00').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'month',
            dayOfMonth: 12,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-02-12 12:23'))
      })

      it('should return the next week on the given date if day is higher', () => {
        Date.now = jest.fn(() => new Date('2020-01-13 00:00').getTime())

        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'month',
            dayOfMonth: 12,
            time: '12:23',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-02-12 12:23'))
      })
    })

    describe('cron', () => {
      it('should return the next cron match', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'cron',
            expression: '10 12 * * *',
          },
        })
        expect(service.getTriggerNextCheck(trigger)).toEqual(new Date('2020-01-01 12:10'))
      })

      it('should thrown an error if cron is not valid', () => {
        const trigger = mock.getInstanceOfWorkflowTrigger({
          enabled: true,
          schedule: {
            frequency: 'cron',
            expression: '* 10 12 * * *',
          },
        })
        expect(() => service.getTriggerNextCheck(trigger)).toThrow(/Invalid cron expression/)
      })
    })
  })

  describe('incrementWorkflowRunFailures', () => {
    it('should incremente workflow run failures', async () => {
      const trigger = await mock.createWorkflowTriggerDeep()
      expect((await service.findById(trigger.id))?.consecutiveWorkflowFails).toBe(0)
      await service.incrementWorkflowRunFailures(mock.workflow._id)
      expect((await service.findById(trigger.id))?.consecutiveWorkflowFails).toBe(1)
      await service.incrementWorkflowRunFailures(mock.workflow._id)
      expect((await service.findById(trigger.id))?.consecutiveWorkflowFails).toBe(2)
      await service.incrementWorkflowRunFailures(mock.workflow._id)
      expect((await service.findById(trigger.id))?.consecutiveWorkflowFails).toBe(3)
    })

    it('should disable the workflow if failures new number of is 3 or more', async () => {
      const trigger = await mock.createWorkflowTriggerDeep({ consecutiveWorkflowFails: 2 })
      expect((await service.findById(trigger.id))?.enabled).toBe(true)
      await service.incrementWorkflowRunFailures(mock.workflow._id)
      expect((await service.findById(trigger.id))?.enabled).toBe(false)
    })
  })
})
