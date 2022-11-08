import { CommonModule } from '@app/common'
import { BlockchainModule } from '@blockchain/blockchain'
import { BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { ChainJetRunnerService } from '@blockchain/blockchain/runner/chainjet-runner.service'
import { Test, TestingModule } from '@nestjs/testing'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { EvmRunnerService } from './evm-runner.service'
import { OperationRunnerService } from './operation-runner.service'

describe('OperationRunService', () => {
  let service: OperationRunnerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [MockModule, CommonModule, BlockchainModule],
      providers: [
        OperationRunnerService,
        EvmRunnerService,
        ChainJetRunnerService,
        ProviderService,
        BlockchainConfigService,
      ],
    }).compile()

    service = testModule.get<OperationRunnerService>(OperationRunnerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
