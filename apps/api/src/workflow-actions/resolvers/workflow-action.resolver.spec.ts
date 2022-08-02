import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { WorkflowAction } from '../entities/workflow-action'
import { WorkflowActionAuthorizer, WorkflowActionResolver } from './workflow-action.resolver'

describe('WorkflowActionResolver', () => {
  let resolver: WorkflowActionResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([WorkflowAction]), MockModule],
      providers: [WorkflowActionResolver, WorkflowActionAuthorizer],
    }).compile()

    resolver = module.get<WorkflowActionResolver>(WorkflowActionResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
