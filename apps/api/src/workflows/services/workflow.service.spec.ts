import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { Workflow } from '../entities/workflow'
import { WorkflowService } from './workflow.service'

describe('WorkflowService', () => {
  let service: WorkflowService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([Workflow]), MockModule],
      providers: [WorkflowService],
    }).compile()

    service = testModule.get<WorkflowService>(WorkflowService)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  beforeEach(async () => {
    await mock.createUser()
    await mock.createWorkflowDeep()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('updateOne', () => {
    it('should throw an error if runOnFailure', async () => {
      await expect(service.updateOne(mock.workflow.id, { runOnFailure: mock.workflow._id })).rejects.toThrow(
        /Run On Failure cannot be set with the same workflow ID./,
      )
    })
  })
})
