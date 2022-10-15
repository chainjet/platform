import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { CreateWorkflowAction } from './actions/create-workflow'
import { DeleteWorkflowAction } from './actions/delete-workflow'

export class WorkflowsDefinition extends SingleIntegrationDefinition {
  integrationKey = 'workflows'
  integrationVersion = '1'
  schemaUrl = null

  actions = [new CreateWorkflowAction(), new DeleteWorkflowAction()]
}
