import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationAction } from 'apps/api/src/integration-actions/entities/integration-action'
import { WorkflowAction } from 'apps/api/src/workflow-actions/entities/workflow-action'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { Observable } from 'rxjs'
import { RunResponse } from './definition'
import { Operation } from './operation'
import { OperationType } from './types/OperationType'

export abstract class OperationAction extends Operation {
  type = OperationType.OffChain

  abstract run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null

  beforeCreate(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> | null {
    return null
  }

  beforeUpdate(
    update: Partial<WorkflowAction>,
    prevWorkflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowAction>> | null {
    return null
  }

  beforeDelete(
    workflowAction: Partial<WorkflowAction>,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ) {}

  afterCreate(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowAction>) => Promise<WorkflowAction>,
  ) {}

  afterUpdate(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowAction>) => Promise<WorkflowAction>,
  ) {}

  afterDelete(
    workflowAction: WorkflowAction,
    integrationAction: IntegrationAction,
    accountCredential: AccountCredential | null,
  ) {}
}
