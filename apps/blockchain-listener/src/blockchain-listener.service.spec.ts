import { redisForRoot } from '@app/common/utils/redis.utils'
import { BlockchainModule } from '@blockchain/blockchain'
import { BlockchainConfigService } from '@blockchain/blockchain/blockchain.config'
import { ProviderService } from '@blockchain/blockchain/provider/provider.service'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationTriggersModule } from 'apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from 'apps/api/src/integrations/integrations.module'
import { WorkflowActionsModule } from 'apps/api/src/workflow-actions/workflow-actions.module'
import { WorkflowRunsModule } from 'apps/api/src/workflow-runs/workflow-runs.module'
import { WorkflowTriggersModule } from 'apps/api/src/workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from 'apps/api/src/workflows/workflows.module'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { TestDatabaseModule } from 'libs/common/test/database/test-database.module'
import { BlockchainListenerService } from './blockchain-listener.service'

describe('BlockchainListenerService', () => {
  let service: BlockchainListenerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TestDatabaseModule,
        redisForRoot(),
        ScheduleModule.forRoot(),
        IntegrationsModule,
        IntegrationTriggersModule,
        WorkflowsModule,
        WorkflowTriggersModule,
        WorkflowActionsModule,
        WorkflowRunsModule,
        RunnerModule,
        BlockchainModule,
      ],
      providers: [BlockchainListenerService, ProviderService, BlockchainConfigService],
    }).compile()

    service = testModule.get<BlockchainListenerService>(BlockchainListenerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
