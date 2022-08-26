import { DefinitionsModule } from '@app/definitions'
import { Module } from '@nestjs/common'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { AuthModule } from '../auth/auth.module'
import { IntegrationActionsModule } from '../integration-actions/integration-actions.module'
import { IntegrationTriggersModule } from '../integration-triggers/integration-triggers.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { AsyncSchemaResolver } from './resolvers/async-schema.resolver'

@Module({
  imports: [
    AuthModule,
    IntegrationsModule,
    IntegrationTriggersModule,
    IntegrationActionsModule,
    DefinitionsModule,
    RunnerModule,
  ],
  providers: [AsyncSchemaResolver],
})
export class AsyncSchemaModule {}
