import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule } from 'libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunAction } from '../entities/workflow-run-action'
import { WorkflowRunTrigger } from '../entities/workflow-run-trigger'
import { WorkflowSleep } from '../entities/workflow-sleep'
import { WorkflowRunAuthorizer, WorkflowRunResolver } from './workflow-run.resolver'

describe('WorkflowRunResolver', () => {
  let resolver: WorkflowRunResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        NestjsQueryGraphQLModule.forFeature({
          imports: [
            NestjsQueryTypegooseModule.forFeature([WorkflowRun, WorkflowRunTrigger, WorkflowRunAction, WorkflowSleep]),
          ],
          resolvers: [
            {
              DTOClass: WorkflowRunTrigger,
              EntityClass: WorkflowRunTrigger,
              create: { disabled: true },
              update: { disabled: true },
              delete: { disabled: true },
            },
            {
              DTOClass: WorkflowRunAction,
              EntityClass: WorkflowRunAction,
              create: { disabled: true },
              update: { disabled: true },
              delete: { disabled: true },
            },
          ],
          dtos: [{ DTOClass: WorkflowRun }, { DTOClass: WorkflowSleep }],
        }),
        MockModule,
      ],
      providers: [WorkflowRunResolver, WorkflowRunAuthorizer],
    }).compile()

    resolver = testModule.get<WorkflowRunResolver>(WorkflowRunResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
