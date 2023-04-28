import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { CompilerService } from '../../compiler/compiler.service'
import { Workflow, WorkflowAuthorizer } from '../entities/workflow'
import { WorkflowService } from '../services/workflow.service'
import { WorkflowResolver } from './workflow.resolver'

describe('WorkflowResolver', () => {
  let resolver: WorkflowResolver

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([Workflow])],
          dtos: [{ DTOClass: Workflow }],
        }),
        MockModule,
      ],
      providers: [WorkflowResolver, WorkflowService, WorkflowAuthorizer, CompilerService],
    }).compile()

    resolver = testModule.get<WorkflowResolver>(WorkflowResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
