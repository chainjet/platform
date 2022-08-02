import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { Workflow } from '../entities/workflow'
import { WorkflowService } from './workflow.service'

describe('WorkflowService', () => {
  let service: WorkflowService
  let mock: MockService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([Workflow]), MockModule],
      providers: [WorkflowService],
    }).compile()

    service = module.get<WorkflowService>(WorkflowService)
    mock = module.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('updateOne', () => {
    it('should update workflow slug if workflow name changed', async () => {
      const workflow = await mock.createWorkflowDeep({
        name: 'test',
        slug: 'test/test/workflow/test',
      })
      await service.updateOne(workflow.id, { name: 'new-name' })
      const updated = await service.findById(workflow.id)
      expect(updated?.slug).toEqual('test/test/workflow/new-name')
    })

    it('should not change the slug if workflow name is not changed', async () => {
      const workflow = await mock.createWorkflowDeep({
        name: 'test',
        slug: 'test/test/workflow/test',
      })
      await service.updateOne(workflow.id, {})
      const updated = await service.findById(workflow.id)
      expect(updated?.slug).toEqual('test/test/workflow/test')
    })

    it('should throw an error if runOnFailure', async () => {
      const workflow = await mock.createWorkflowDeep()
      await expect(service.updateOne(workflow.id, { runOnFailure: workflow._id })).rejects.toThrow(
        /Run On Failure cannot be set with the same workflow ID./,
      )
    })
  })
})
