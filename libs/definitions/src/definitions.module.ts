import { Module } from '@nestjs/common'
import { IntegrationAccountsModule } from '../../../apps/api/src/integration-accounts/integration-accounts.module'
import { IntegrationActionsModule } from '../../../apps/api/src/integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../../../apps/api/src/integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../../../apps/api/src/integrations/integrations.module'
import { IntegrationDefinitionFactory } from './integration-definition.factory'
import { SchemaService } from './schema/services/schema.service'
import { IntegrationInstallerService } from './services/integration-installer.service'

@Module({
  imports: [
    IntegrationsModule,
    IntegrationAccountsModule,
    IntegrationActionsModule,
    IntegrationTriggersModule
  ],
  providers: [IntegrationDefinitionFactory, SchemaService, IntegrationInstallerService],
  exports: [IntegrationDefinitionFactory, IntegrationInstallerService, SchemaService]
})
export class DefinitionsModule {}
