import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule, closeMongoConnection } from 'libs/common/test/database/test-database.module'
import { MockModule } from 'libs/common/test/mock.module'
import { WorkflowTrigger, WorkflowTriggerAuthorizer } from '../entities/workflow-trigger'
import { WorkflowUsedId } from '../entities/workflow-used-id'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'
import { WorkflowTriggerResolver } from './workflow-trigger.resolver'

describe('WorkflowTriggerResolver', () => {
  let resolver: WorkflowTriggerResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        NestjsQueryGraphQLModule.forFeature({
          imports: [
            NestjsQueryTypegooseModule.forFeature([WorkflowTrigger]),
            NestjsQueryTypegooseModule.forFeature([WorkflowUsedId]),
          ],
          dtos: [{ DTOClass: WorkflowTrigger }, { DTOClass: WorkflowUsedId }],
        }),
        MockModule,
        TestDatabaseModule,
      ],
      providers: [WorkflowTriggerResolver, WorkflowTriggerService, WorkflowTriggerAuthorizer],
    }).compile()

    resolver = testModule.get<WorkflowTriggerResolver>(WorkflowTriggerResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
