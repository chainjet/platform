import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from '../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { OperationRunnerService } from './operation-runner.service'
import { RunnerService } from './runner.service'

describe('RunnerService', () => {
  let service: RunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MockModule
      ],
      providers: [RunnerService, OperationRunnerService]
    }).compile()

    service = module.get<RunnerService>(RunnerService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
