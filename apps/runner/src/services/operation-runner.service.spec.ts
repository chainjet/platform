import { Test, TestingModule } from '@nestjs/testing'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { OperationRunnerService } from './operation-runner.service'

describe('OperationRunService', () => {
  let service: OperationRunnerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockModule],
      providers: [OperationRunnerService]
    }).compile()

    service = module.get<OperationRunnerService>(OperationRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
