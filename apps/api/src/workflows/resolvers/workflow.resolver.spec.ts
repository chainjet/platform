import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { Workflow } from '../entities/workflow'
import { WorkflowService } from '../services/workflow.service'
import { WorkflowAuthorizer, WorkflowResolver } from './workflow.resolver'

describe('WorkflowResolver', () => {
  let resolver: WorkflowResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([Workflow]), MockModule],
      providers: [WorkflowResolver, WorkflowService, WorkflowAuthorizer],
    }).compile()

    resolver = module.get<WorkflowResolver>(WorkflowResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
