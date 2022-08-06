import { DefinitionsModule } from '@app/definitions'
import { Module } from '@nestjs/common'
import { RunnerModule } from 'apps/runner/src/runner.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { AsyncSchemaResolver } from './resolvers/async-schema.resolver'

@Module({
  imports: [IntegrationsModule, DefinitionsModule, RunnerModule],
  providers: [AsyncSchemaResolver],
})
export class AsyncSchemaModule {}
