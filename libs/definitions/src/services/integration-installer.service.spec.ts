import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationAccountsModule } from '../../../../apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from '../../../../apps/api/src/integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../../../../apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../../../../apps/api/src/integrations/integrations.module'
import { TestDatabaseModule } from '../../../common/test/database/test-database.module'
import { SchemaService } from '../schema/services/schema.service'
import { IntegrationInstallerService } from './integration-installer.service'

describe('IntegrationInstallerService', () => {
  let service: IntegrationInstallerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntegrationInstallerService, SchemaService],
      imports: [
        TestDatabaseModule,
        IntegrationsModule,
        IntegrationAccountsModule,
        IntegrationActionsModule,
        IntegrationTriggersModule
      ]
    }).compile()

    service = module.get<IntegrationInstallerService>(IntegrationInstallerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
