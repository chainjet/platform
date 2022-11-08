import { Definition, RunResponse, SingleIntegrationDefinition } from '@app/definitions'
import { OperationTrigger } from '@app/definitions/operation-trigger'
import { OperationOffChain } from '@app/definitions/opertion-offchain'
import { Injectable } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { OperationRunOptions } from 'apps/runner/src/services/operation-runner.service'
import { Observable } from 'rxjs'
import { AuthService } from '../../../apps/api/src/auth/services/auth.service'
import { IntegrationAction } from '../../../apps/api/src/integration-actions/entities/integration-action'
import { IntegrationActionService } from '../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTrigger } from '../../../apps/api/src/integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from '../../../apps/api/src/integrations/entities/integration'
import { IntegrationService } from '../../../apps/api/src/integrations/services/integration.service'
import { User } from '../../../apps/api/src/users/entities/user'
import { UserService } from '../../../apps/api/src/users/services/user.service'
import {
  CreateWorkflowActionInput,
  WorkflowAction,
} from '../../../apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowActionService } from '../../../apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRun } from '../../../apps/api/src/workflow-runs/entities/workflow-run'
import { WorkflowRunStartedByOptions } from '../../../apps/api/src/workflow-runs/entities/workflow-run-started-by-options'
import { WorkflowRunStatus } from '../../../apps/api/src/workflow-runs/entities/workflow-run-status'
import { WorkflowRunService } from '../../../apps/api/src/workflow-runs/services/workflow-run.service'
import {
  CreateWorkflowTriggerInput,
  WorkflowTrigger,
} from '../../../apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../../apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { CreateWorkflowInput, Workflow } from '../../../apps/api/src/workflows/entities/workflow'
import { WorkflowService } from '../../../apps/api/src/workflows/services/workflow.service'
import { RunnerService } from '../../../apps/runner/src/services/runner.service'

@Injectable()
export class MockService {
  constructor(
    public authService: AuthService,
    public userService: UserService,
    public integrationService: IntegrationService,
    public integrationTriggerService: IntegrationTriggerService,
    public integrationActionService: IntegrationActionService,
    public workflowService: WorkflowService,
    public workflowTriggerService: WorkflowTriggerService,
    public workflowActionService: WorkflowActionService,
    public workflowRunService: WorkflowRunService,
    public runnerService: RunnerService,
  ) {}

  user: User
  integration: Integration
  integrationTrigger: IntegrationTrigger
  integrationAction: IntegrationAction
  workflow: Workflow
  workflowTrigger: WorkflowTrigger
  workflowAction: WorkflowAction
  workflowRun: WorkflowRun

  dropDatabase(): Promise<any> {
    return this.userService.Model.db.dropDatabase()
  }

  getDefinition(opts: { integrationKey?: string; integrationVersion?: string; schemaUrl?: string }): Definition {
    class MockDefinitionTrigger extends OperationTrigger {
      key = 'test-integration-trigger'
      name = ''
      description = ''
      version = '1'
      inputs = {}
      idKey = 'items[].id'

      async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> {
        return {
          outputs: {
            items: [{ id: 1 }, { id: 2 }, { id: 3 }],
          },
        }
      }
    }

    class MockDefinitionAction extends OperationOffChain {
      key = 'test-integration-action'
      name = ''
      description = ''
      version = '1'
      inputs = {}

      async run(opts: OperationRunOptions): Promise<RunResponse | Observable<RunResponse> | null> {
        return {
          outputs: {
            foo: 'bar',
          },
        }
      }
    }

    class MockDefinition extends SingleIntegrationDefinition {
      integrationKey = opts.integrationKey ?? 'test-integration'
      integrationVersion = opts.integrationVersion ?? '1'
      schemaUrl = opts.schemaUrl ?? null

      triggers = [new MockDefinitionTrigger()]
      actions = [new MockDefinitionAction()]
    }

    return new MockDefinition()
  }

  getInstanceOfUser(record: DeepPartial<User> = {}): User {
    return {
      address: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF',
      email: 'test@example.com',
      ...record,
    } as User
  }

  async createUser(record: DeepPartial<User> = {}): Promise<User> {
    this.user = await this.userService.createOne(this.getInstanceOfUser(record))
    return this.user
  }

  getInstanceOfIntegration(record: DeepPartial<Integration> = {}): Integration {
    return {
      name: 'Test Integration',
      key: 'test-integration',
      version: '1',
      deprecated: false,
      ...record,
    } as Integration
  }

  async createIntegration(record: DeepPartial<Integration> = {}): Promise<Integration> {
    this.integration = (await this.integrationService.Model.create(this.getInstanceOfIntegration(record))).toObject({
      virtuals: true,
    })
    return this.integration
  }

  getInstanceOfIntegrationTrigger(record: DeepPartial<IntegrationTrigger> = {}): IntegrationTrigger {
    return {
      name: 'Test Integration Trigger',
      key: 'test-integration-trigger',
      integration: this.integration?._id,
      schemaRequest: {},
      schemaResponse: {},
      idKey: 'items[].id',
      ...record,
    } as IntegrationTrigger
  }

  async createIntegrationTrigger(record: DeepPartial<IntegrationTrigger> = {}): Promise<IntegrationTrigger> {
    this.integrationTrigger = (
      await this.integrationTriggerService.Model.create(this.getInstanceOfIntegrationTrigger(record))
    ).toObject({ virtuals: true })
    return this.integrationTrigger
  }

  async createIntegrationTriggerDeep(record: DeepPartial<IntegrationTrigger> = {}): Promise<IntegrationTrigger> {
    await this.createIntegration()
    return await this.createIntegrationTrigger(record)
  }

  getInstanceOfIntegrationAction(record: DeepPartial<IntegrationAction> = {}): IntegrationAction {
    return {
      name: 'Test Integration Action',
      key: 'test-integration-action',
      integration: this.integration?._id,
      schemaRequest: {},
      schemaResponse: {},
      ...record,
    } as IntegrationAction
  }

  async createIntegrationAction(record: DeepPartial<IntegrationAction> = {}): Promise<IntegrationAction> {
    this.integrationAction = (
      await this.integrationActionService.Model.create(this.getInstanceOfIntegrationAction(record))
    ).toObject({ virtuals: true })
    return this.integrationAction
  }

  async createIntegrationActionDeep(record: DeepPartial<IntegrationAction> = {}): Promise<IntegrationAction> {
    await this.createIntegration()
    return await this.createIntegrationAction(record)
  }

  getInstanceOfWorkflow(record: DeepPartial<CreateWorkflowInput & Workflow> = {}): Workflow {
    return {
      owner: this.user?._id,
      name: 'Test Workflow',
      ...record,
    } as Workflow
  }

  async createWorkflow(record: DeepPartial<CreateWorkflowInput & Workflow> = {}): Promise<Workflow> {
    this.workflow = await this.workflowService.createOne(this.getInstanceOfWorkflow(record))
    return this.workflow
  }

  async createWorkflowDeep(record: DeepPartial<CreateWorkflowInput & Workflow> = {}): Promise<Workflow> {
    return await this.createWorkflow(record)
  }

  getInstanceOfWorkflowTrigger(
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {},
  ): WorkflowTrigger {
    return {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      name: 'test',
      integrationTrigger: this.integrationTrigger?._id,
      inputs: {},
      ...record,
    } as WorkflowTrigger
  }

  async createWorkflowTrigger(
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {},
  ): Promise<WorkflowTrigger> {
    this.workflowTrigger = (
      await this.workflowTriggerService.Model.create(this.getInstanceOfWorkflowTrigger(record))
    ).toObject({ virtuals: true })
    return this.workflowTrigger
  }

  async createWorkflowTriggerDeep(
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {},
  ): Promise<WorkflowTrigger> {
    await this.createIntegrationTriggerDeep()
    await this.createWorkflowDeep()
    return await this.createWorkflowTrigger(record)
  }

  getInstanceOfWorkflowAction(record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {}): WorkflowAction {
    return {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      name: 'test',
      integrationAction: this.integrationAction?._id,
      inputs: {},
      ...record,
    } as WorkflowAction
  }

  async createWorkflowAction(
    record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {},
  ): Promise<WorkflowAction> {
    this.workflowAction = (
      await this.workflowActionService.Model.create(this.getInstanceOfWorkflowAction(record))
    ).toObject({ virtuals: true })
    return this.workflowAction
  }

  async createWorkflowActionDeep(
    record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {},
  ): Promise<WorkflowAction> {
    await this.createIntegrationActionDeep()
    await this.createWorkflowDeep()
    return await this.createWorkflowAction(record)
  }

  getInstanceOfWorkflowRun(record: DeepPartial<WorkflowRun> = {}): WorkflowRun {
    return {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      status: WorkflowRunStatus.running,
      startedBy: WorkflowRunStartedByOptions.trigger,
      ...record,
    } as WorkflowRun
  }

  async createWorkflowRun(record: DeepPartial<WorkflowRun> = {}): Promise<WorkflowRun> {
    this.workflowRun = (await this.workflowRunService.Model.create(this.getInstanceOfWorkflowRun(record))).toObject({
      virtuals: true,
    })
    return this.workflowRun
  }

  async createWorkflowRunDeep(record: DeepPartial<WorkflowRun> = {}): Promise<WorkflowRun> {
    await this.createWorkflowDeep()
    return await this.createWorkflowRun(record)
  }
}
