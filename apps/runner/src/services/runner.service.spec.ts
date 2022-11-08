import { CommonModule } from '@app/common'
import { BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { ChainJetRunnerService } from '@blockchain/blockchain/runner/chainjet-runner.service'
import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from '../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { EvmRunnerService } from './evm-runner.service'
import { OperationRunnerService } from './operation-runner.service'
import { RunnerService } from './runner.service'

describe('RunnerService', () => {
  let service: RunnerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [MockModule, CommonModule],
      providers: [
        RunnerService,
        OperationRunnerService,
        EvmRunnerService,
        ChainJetRunnerService,
        ProviderService,
        BlockchainConfigService,
      ],
    }).compile()

    service = testModule.get<RunnerService>(RunnerService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
