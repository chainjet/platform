import { DefinitionsModule } from '@app/definitions'
import { Test, TestingModule } from '@nestjs/testing'
import { IntegrationActionsModule } from '../integration-actions/integration-actions.module'
import { IntegrationsModule } from '../integrations/integrations.module'
import { WorkflowActionsModule } from '../workflow-actions/workflow-actions.module'
import { CompilerService } from './compiler.service'

describe('CompilerService', () => {
  let service: CompilerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [IntegrationsModule, IntegrationActionsModule, WorkflowActionsModule, DefinitionsModule],
      providers: [CompilerService],
    }).compile()

    service = testModule.get<CompilerService>(CompilerService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
