import { Module } from '@nestjs/common'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { WorkflowTriggersModule } from '../workflow-triggers/workflow-triggers.module'
import { WorkflowsModule } from '../workflows/workflows.module'
import { TemplateService } from './services/template.service'

@Module({
  imports: [WorkflowsModule, WorkflowTriggersModule, WorkflowActionsModule],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplatesModule {}
