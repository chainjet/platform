import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunAuthorizer, WorkflowRunResolver } from './workflow-run.resolver'

describe('WorkflowRunResolver', () => {
  let resolver: WorkflowRunResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([WorkflowRun]),
        MockModule
      ],
      providers: [WorkflowRunResolver, WorkflowRunAuthorizer]
    }).compile()

    resolver = module.get<WorkflowRunResolver>(WorkflowRunResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
