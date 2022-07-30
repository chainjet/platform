import { DeepPartial } from '@nestjs-query/core'
import { Injectable } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { AuthService } from '../../../apps/api/src/auth/services/auth.service'
import { IntegrationAction } from '../../../apps/api/src/integration-actions/entities/integration-action'
import { IntegrationActionService } from '../../../apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTrigger } from '../../../apps/api/src/integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../../apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from '../../../apps/api/src/integrations/entities/integration'
import { IntegrationService } from '../../../apps/api/src/integrations/services/integration.service'
import { CreateProjectInput, Project } from '../../../apps/api/src/projects/entities/project'
import { ProjectService } from '../../../apps/api/src/projects/services/project.service'
import { User } from '../../../apps/api/src/users/entities/user'
import { UserProvider } from '../../../apps/api/src/users/entities/user-provider'
import { UserProviderService } from '../../../apps/api/src/users/services/user-provider.service'
import { UserService } from '../../../apps/api/src/users/services/user.service'
import { CreateWorkflowActionInput, WorkflowAction } from '../../../apps/api/src/workflow-actions/entities/workflow-action'
import { WorkflowActionService } from '../../../apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRun } from '../../../apps/api/src/workflow-runs/entities/workflow-run'
import { WorkflowRunStartedByOptions } from '../../../apps/api/src/workflow-runs/entities/workflow-run-started-by-options'
import { WorkflowRunStatus } from '../../../apps/api/src/workflow-runs/entities/workflow-run-status'
import { WorkflowRunService } from '../../../apps/api/src/workflow-runs/services/workflow-run.service'
import { CreateWorkflowTriggerInput, WorkflowTrigger } from '../../../apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../../apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { CreateWorkflowInput, Workflow } from '../../../apps/api/src/workflows/entities/workflow'
import { WorkflowService } from '../../../apps/api/src/workflows/services/workflow.service'
import { RunnerService } from '../../../apps/runner/src/services/runner.service'

@Injectable()
export class MockService {
  constructor (
    public authService: AuthService,
    public userService: UserService,
    public userProviderService: UserProviderService,
    public projectService: ProjectService,
    public integrationService: IntegrationService,
    public integrationTriggerService: IntegrationTriggerService,
    public integrationActionService: IntegrationActionService,
    public workflowService: WorkflowService,
    public workflowTriggerService: WorkflowTriggerService,
    public workflowActionService: WorkflowActionService,
    public workflowRunService: WorkflowRunService,
    public runnerService: RunnerService
  ) {}

  user: User
  userProvider: UserProvider
  project: Project
  integration: Integration
  integrationTrigger: IntegrationTrigger
  integrationAction: IntegrationAction
  workflow: Workflow
  workflowTrigger: WorkflowTrigger
  workflowAction: WorkflowAction
  workflowRun: WorkflowRun

  dropDatabase (): Promise<any> {
    return this.userService.Model.db.dropDatabase()
  }

  getInstanceOfUser (
    record: DeepPartial<User> = {}
  ): User {
    return plainToClass(User, {
      username: 'test',
      email: 'test@example.com',
      ...record
    })
  }

  async createUser (
    record: DeepPartial<User> = {}
  ): Promise<User> {
    this.user = (await this.userService.Model.create(this.getInstanceOfUser(record))).toObject({ virtuals: true })
    return this.user
  }

  getInstanceOfUserProvider (
    record: DeepPartial<UserProvider> = {}
  ): UserProvider {
    return plainToClass(UserProvider, {
      user: this.user?._id,
      provider: 'google',
      primaryEmail: 'test@example.com',
      profileId: '123',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com', verified: false }],
      ...record
    })
  }

  async createUserProvider (
    record: DeepPartial<UserProvider> = {}
  ): Promise<UserProvider> {
    this.userProvider = (await this.userProviderService.Model.create(this.getInstanceOfUserProvider(record)))
      .toObject({ virtuals: true })
    return this.userProvider
  }

  async createUserProviderDeep (
    record: DeepPartial<UserProvider> = {}
  ): Promise<UserProvider> {
    await this.createUser()
    return await this.createUserProvider(record)
  }

  getInstanceOfIntegration (
    record: DeepPartial<Integration> = {}
  ): Integration {
    return plainToClass(Integration, {
      name: 'Test Integration',
      key: 'test-integration',
      version: '1',
      deprecated: false,
      ...record
    })
  }

  async createIntegration (
    record: DeepPartial<Integration> = {}
  ): Promise<Integration> {
    this.integration = (await this.integrationService.Model.create(this.getInstanceOfIntegration(record)))
      .toObject({ virtuals: true })
    return this.integration
  }

  getInstanceOfIntegrationTrigger (
    record: DeepPartial<IntegrationTrigger> = {}
  ): IntegrationTrigger {
    return plainToClass(IntegrationTrigger, {
      name: 'Test Integration Trigger',
      key: 'test-integration-trigger',
      integration: this.integration?._id,
      schemaRequest: {},
      schemaResponse: {},
      ...record
    })
  }

  async createIntegrationTrigger (
    record: DeepPartial<IntegrationTrigger> = {}
  ): Promise<IntegrationTrigger> {
    this.integrationTrigger = (await this.integrationTriggerService.Model.create(this.getInstanceOfIntegrationTrigger(record)))
      .toObject({ virtuals: true })
    return this.integrationTrigger
  }

  async createIntegrationTriggerDeep (
    record: DeepPartial<IntegrationTrigger> = {}
  ): Promise<IntegrationTrigger> {
    await this.createIntegration()
    return await this.createIntegrationTrigger(record)
  }

  getInstanceOfIntegrationAction (
    record: DeepPartial<IntegrationAction> = {}
  ): IntegrationAction {
    return plainToClass(IntegrationAction, {
      name: 'Test Integration Action',
      key: 'test-integration-action',
      integration: this.integration?._id,
      schemaRequest: {},
      schemaResponse: {},
      ...record
    })
  }

  async createIntegrationAction (
    record: DeepPartial<IntegrationAction> = {}
  ): Promise<IntegrationAction> {
    this.integrationAction = (await this.integrationActionService.Model.create(this.getInstanceOfIntegrationAction(record)))
      .toObject({ virtuals: true })
    return this.integrationAction
  }

  async createIntegrationActionDeep (
    record: DeepPartial<IntegrationAction> = {}
  ): Promise<IntegrationAction> {
    await this.createIntegration()
    return await this.createIntegrationAction(record)
  }

  getInstanceOfProject (
    record: DeepPartial<CreateProjectInput & Project> = {}
  ): Project {
    return plainToClass(Project, {
      owner: this.user?._id,
      name: 'Test Project',
      slug: 'test/test-project',
      public: false,
      ...record
    })
  }

  async createProject (
    record: DeepPartial<CreateProjectInput & Project> = {}
  ): Promise<Project> {
    this.project = (await this.projectService.Model.create(this.getInstanceOfProject(record)))
      .toObject({ virtuals: true })
    return this.project
  }

  async createProjectDeep (
    record: DeepPartial<CreateProjectInput & Project> = {}
  ): Promise<Project> {
    await this.createUser()
    return await this.createProject(record)
  }

  getInstanceOfWorkflow (
    record: DeepPartial<CreateWorkflowInput & Workflow> = {}
  ): Workflow {
    return plainToClass(Workflow, {
      owner: this.user?._id,
      project: this.project?._id,
      name: 'Test Workflow',
      slug: 'test/test-project/test-workflow',
      ...record
    })
  }

  async createWorkflow (
    record: DeepPartial<CreateWorkflowInput & Workflow> = {}
  ): Promise<Workflow> {
    this.workflow = (await this.workflowService.Model.create(this.getInstanceOfWorkflow(record)))
      .toObject({ virtuals: true })
    return this.workflow
  }

  async createWorkflowDeep (
    record: DeepPartial<CreateWorkflowInput & Workflow> = {}
  ): Promise<Workflow> {
    await this.createProjectDeep()
    return await this.createWorkflow(record)
  }

  getInstanceOfWorkflowTrigger (
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {}
  ): WorkflowTrigger {
    return plainToClass(WorkflowTrigger, {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      name: 'test',
      integrationTrigger: this.integrationTrigger?._id,
      inputs: {},
      ...record
    })
  }

  async createWorkflowTrigger (
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {}
  ): Promise<WorkflowTrigger> {
    this.workflowTrigger = (await this.workflowTriggerService.Model.create(this.getInstanceOfWorkflowTrigger(record)))
      .toObject({ virtuals: true })
    return this.workflowTrigger
  }

  async createWorkflowTriggerDeep (
    record: DeepPartial<CreateWorkflowTriggerInput & WorkflowTrigger> = {}
  ): Promise<WorkflowTrigger> {
    await this.createIntegrationTriggerDeep()
    await this.createWorkflowDeep()
    return await this.createWorkflowTrigger(record)
  }

  getInstanceOfWorkflowAction (
    record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {}
  ): WorkflowAction {
    return plainToClass(WorkflowAction, {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      name: 'test',
      integrationAction: this.integrationAction?._id,
      inputs: {},
      ...record
    })
  }

  async createWorkflowAction (
    record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {}
  ): Promise<WorkflowAction> {
    this.workflowAction = (await this.workflowActionService.Model.create(this.getInstanceOfWorkflowAction(record)))
      .toObject({ virtuals: true })
    return this.workflowAction
  }

  async createWorkflowActionDeep (
    record: DeepPartial<CreateWorkflowActionInput & WorkflowAction> = {}
  ): Promise<WorkflowAction> {
    await this.createIntegrationActionDeep()
    await this.createWorkflowDeep()
    return await this.createWorkflowAction(record)
  }

  getInstanceOfWorkflowRun (
    record: DeepPartial<WorkflowRun> = {}
  ): WorkflowRun {
    return plainToClass(WorkflowRun, {
      owner: this.user?._id,
      workflow: this.workflow?._id,
      status: WorkflowRunStatus.running,
      startedBy: WorkflowRunStartedByOptions.trigger,
      ...record
    })
  }

  async createWorkflowRun (
    record: DeepPartial<WorkflowRun> = {}
  ): Promise<WorkflowRun> {
    this.workflowRun = (await this.workflowRunService.Model.create(this.getInstanceOfWorkflowRun(record)))
      .toObject({ virtuals: true })
    return this.workflowRun
  }

  async createWorkflowRunDeep (
    record: DeepPartial<WorkflowRun> = {}
  ): Promise<WorkflowRun> {
    await this.createWorkflowDeep()
    return await this.createWorkflowRun(record)
  }
}
