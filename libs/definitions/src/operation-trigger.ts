import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { Observable } from 'rxjs'
import { RunResponse } from './definition'
import { Operation } from './operation'
import { OperationType } from './types/OperationType'

export abstract class OperationTrigger extends Operation {
  type = OperationType.OffChain

  abstract idKey: string
  triggerPopulate?: {
    operationId: string
    inputs: Record<string, string>
  }
  triggerInstant?: boolean
  triggerHook?: boolean
  triggerHookInstructions?: string

  supportsPagination = false

  abstract run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> | null

  beforeCreate(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> | null {
    return null
  }

  beforeUpdate(
    update: Partial<WorkflowTrigger>,
    prevWorkflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ): Promise<Partial<WorkflowTrigger>> | null {
    return null
  }

  beforeDelete(
    workflowTrigger: Partial<WorkflowTrigger>,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ) {}

  afterCreate(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
  ) {}

  afterUpdate(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
    update: (data: Partial<WorkflowTrigger>) => Promise<WorkflowTrigger>,
  ) {}

  afterDelete(
    workflowTrigger: WorkflowTrigger,
    integrationTrigger: IntegrationTrigger,
    accountCredential: AccountCredential | null,
  ) {}
}
