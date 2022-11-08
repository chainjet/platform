import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { WorkflowNextActionAssembler } from '../assemblers/workflow-next-action.assembler'
import { WorkflowAction, WorkflowActionAuthorizer } from '../entities/workflow-action'
import { WorkflowNextAction } from '../entities/workflow-next-action'
import { WorkflowActionResolver } from './workflow-action.resolver'

describe('WorkflowActionResolver', () => {
  let resolver: WorkflowActionResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([WorkflowAction, WorkflowNextAction])],
          dtos: [{ DTOClass: WorkflowAction }, { DTOClass: WorkflowNextAction }],
          assemblers: [WorkflowNextActionAssembler],
          resolvers: [
            {
              DTOClass: WorkflowNextAction,
              EntityClass: WorkflowNextAction,
              create: { disabled: true },
              update: { disabled: true },
              delete: { disabled: true },
              AssemblerClass: WorkflowNextActionAssembler,
            },
          ],
        }),
        MockModule,
      ],
      providers: [WorkflowActionResolver, WorkflowActionAuthorizer],
    }).compile()

    resolver = testModule.get<WorkflowActionResolver>(WorkflowActionResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
