import { ScheduleModule } from '@nestjs/schedule'
import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from '../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { WorkflowSchedulerService } from './workflow-scheduler.service'

describe('WorkflowSchedulerService', () => {
  let service: WorkflowSchedulerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot(), MockModule],
      providers: [WorkflowSchedulerService],
    }).compile()

    service = module.get<WorkflowSchedulerService>(WorkflowSchedulerService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
