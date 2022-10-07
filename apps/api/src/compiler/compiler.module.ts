import { DefinitionsModule } from '@app/definitions'
import { forwardRef, Module } from '@nestjs/common'
import { IntegrationActionsModule } from '../integration-actions/integration-actions.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { CompilerService } from './compiler.service'

@Module({
  providers: [CompilerService],
  exports: [CompilerService],
  imports: [forwardRef(() => WorkflowActionsModule), IntegrationsModule, IntegrationActionsModule, DefinitionsModule],
})
export class CompilerModule {}
