import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'
import { WorkflowTriggerAuthorizer, WorkflowTriggerResolver } from './workflow-trigger.resolver'

describe('WorkflowTriggerResolver', () => {
  let resolver: WorkflowTriggerResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([WorkflowTrigger]), MockModule],
      providers: [WorkflowTriggerResolver, WorkflowTriggerService, WorkflowTriggerAuthorizer],
    }).compile()

    resolver = module.get<WorkflowTriggerResolver>(WorkflowTriggerResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
