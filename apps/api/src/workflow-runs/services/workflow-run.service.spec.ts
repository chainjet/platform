import { ObjectID } from '@app/common/utils/mongodb'
import { Test, TestingModule } from '@nestjs/testing'
import { plainToClass } from 'class-transformer'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { WorkflowRun } from '../entities/workflow-run'
import { WorkflowRunAction } from '../entities/workflow-run-action'
import { WorkflowRunStartedByOptions } from '../entities/workflow-run-started-by-options'
import { WorkflowRunStatus } from '../entities/workflow-run-status'
import { WorkflowRunAuthorizer } from '../resolvers/workflow-run.resolver'
import { WorkflowRunService } from './workflow-run.service'

describe('WorkflowRunService', () => {
  let service: WorkflowRunService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([WorkflowRun]), MockModule],
      providers: [WorkflowRunService, WorkflowRunAuthorizer],
    }).compile()

    service = testModule.get<WorkflowRunService>(WorkflowRunService)
    mock = testModule.get<MockService>(MockService)
  })

  beforeEach(async () => {
    await mock.createUser()
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('markWorkflowRunAsCompleted', () => {
    it('should set the status to completed if the current status is running', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({ status: WorkflowRunStatus.running })
      await service.markWorkflowRunAsCompleted(workflowRun._id)
      const updated = await service.findById(workflowRun.id)
      expect(updated?.status).toBe(WorkflowRunStatus.completed)
      expect(updated?.operationsUsed).toBe(0)
    })

    it('should not update the run status if the current status is failed', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({ status: WorkflowRunStatus.failed })
      await service.markWorkflowRunAsCompleted(workflowRun._id)
      const updated = await service.findById(workflowRun.id)
      expect(updated?.status).toBe(WorkflowRunStatus.failed)
      expect(updated?.operationsUsed).toBe(0)
    })
  })

  describe('createOneByInstantTrigger', () => {
    it('should create a workflow run for an instant trigger on a workflow with actions', async () => {
      const integration = await mock.createIntegration()
      const integrationTrigger = await mock.createIntegrationTrigger()
      const workflow = await mock.createWorkflowDeep()
      const workflowTrigger = await mock.createWorkflowTrigger()
      const workflowRun = await service.createOneByInstantTrigger(
        integration,
        integrationTrigger,
        workflow,
        workflowTrigger,
        true,
      )

      expect(workflowRun.startedBy).toEqual(WorkflowRunStartedByOptions.trigger)
      expect(workflowRun.owner).toEqual(mock.user._id)
      expect(workflowRun.workflow).toEqual(workflow._id)
      expect(workflowRun.status).toEqual(WorkflowRunStatus.running)
      expect(workflowRun.triggerRun.integrationName).toEqual('Test Integration')
      expect(workflowRun.triggerRun.operationName).toEqual('Test Integration Trigger')
      expect(workflowRun.triggerRun.status).toEqual(WorkflowRunStatus.completed)
      expect(workflowRun.triggerRun.workflowTrigger).toEqual(mock.workflowTrigger._id)
      expect(workflowRun.triggerRun.workflowTriggered).toEqual(true)
      const updatedUser = await mock.userService.findById(mock.user.id)
      expect(updatedUser?.operationsUsedMonth).toEqual(1)
      expect(updatedUser?.operationsUsedTotal).toEqual(1)
    })

    it('should create a workflow run for an instant trigger on a workflow without actions', async () => {
      const integration = await mock.createIntegration()
      const integrationTrigger = await mock.createIntegrationTrigger()
      const workflow = await mock.createWorkflowDeep()
      const workflowTrigger = await mock.createWorkflowTrigger()
      const workflowRun = await service.createOneByInstantTrigger(
        integration,
        integrationTrigger,
        workflow,
        workflowTrigger,
        false,
      )

      expect(workflowRun.startedBy).toEqual(WorkflowRunStartedByOptions.trigger)
      expect(workflowRun.owner).toEqual(mock.user._id)
      expect(workflowRun.workflow).toEqual(workflow._id)
      expect(workflowRun.status).toEqual(WorkflowRunStatus.completed)
      expect(workflowRun.triggerRun.integrationName).toEqual('Test Integration')
      expect(workflowRun.triggerRun.operationName).toEqual('Test Integration Trigger')
      expect(workflowRun.triggerRun.status).toEqual(WorkflowRunStatus.completed)
      expect(workflowRun.triggerRun.workflowTrigger).toEqual(mock.workflowTrigger._id)
      expect(workflowRun.triggerRun.workflowTriggered).toEqual(false)
      const updatedUser = await mock.userService.findById(mock.user.id)
      expect(updatedUser?.operationsUsedMonth).toEqual(1)
      expect(updatedUser?.operationsUsedTotal).toEqual(1)
    })
  })

  describe('markTriggerAsCompleted', () => {
    it('should mark the trigger as completed and the workflow as not triggered', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({
        triggerRun: {
          integrationName: 'test',
          operationName: 'test',
          workflowTrigger: new ObjectID(),
          status: WorkflowRunStatus.running,
        },
      })
      await service.markTriggerAsCompleted(new ObjectID(), workflowRun._id, false, ['123'])
      const updated = await service.findById(workflowRun.id)
      expect(updated?.operationsUsed).toBe(1)
      expect(updated?.status).toBe(WorkflowRunStatus.completed)
      expect(updated?.triggerRun.status).toBe(WorkflowRunStatus.completed)
      expect(updated?.triggerRun.workflowTriggered).toBe(false)
      expect(updated?.triggerRun.triggerIds).toEqual(['123'])
    })

    it('should mark the trigger as completed and the workflow as triggered', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({
        triggerRun: {
          integrationName: 'test',
          operationName: 'test',
          workflowTrigger: new ObjectID(),
          status: WorkflowRunStatus.running,
        },
      })
      await service.markTriggerAsCompleted(new ObjectID(), workflowRun._id, true, ['123'])
      const updated = await service.findById(workflowRun.id)
      expect(updated?.operationsUsed).toBe(1)
      expect(updated?.status).toBe(WorkflowRunStatus.running)
      expect(updated?.triggerRun.status).toBe(WorkflowRunStatus.completed)
      expect(updated?.triggerRun.workflowTriggered).toBe(true)
      expect(updated?.triggerRun.triggerIds).toEqual(['123'])
    })
  })

  describe('markTriggerAsFailed', () => {
    it('should mark the trigger and run as failed', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({
        triggerRun: {
          integrationName: 'test',
          operationName: 'test',
          workflowTrigger: new ObjectID(),
          status: WorkflowRunStatus.running,
        },
      })
      await service.markTriggerAsFailed(new ObjectID(), workflowRun, 'error message', 'response')
      const updated = await service.findById(workflowRun.id)
      expect(updated?.operationsUsed).toBe(1)
      expect(updated?.status).toBe(WorkflowRunStatus.failed)
      expect(updated?.triggerRun.status).toBe(WorkflowRunStatus.failed)
      expect(updated?.errorMessage).toBe('error message')
      expect(updated?.errorResponse).toBe('response')
    })
  })

  describe('addRunningAction', () => {
    it('should add a new action and mark it as running', async () => {
      const workflowRun = await mock.createWorkflowRunDeep({})
      const workflowActionId = new ObjectID()
      const workflowRunAction = await service.addRunningAction(
        workflowRun._id,
        workflowActionId,
        'service',
        'operation',
      )
      const updated = await service.findById(workflowRun.id)
      expect(updated?.actionRuns).toHaveLength(1)
      expect(updated?.actionRuns[0].status).toBe(WorkflowRunStatus.running)
      expect(updated?.actionRuns[0].workflowAction).toEqual(workflowActionId)
      expect(updated?.operationsUsed).toBe(0)
      expect(workflowRunAction._id).toEqual(updated?.actionRuns[0]._id)
      expect(workflowRunAction.status).toBe(WorkflowRunStatus.running)
      expect(workflowRunAction.workflowAction).toEqual(workflowActionId)
      expect(workflowRunAction.integrationName).toEqual('service')
      expect(workflowRunAction.operationName).toEqual('operation')
    })
  })

  describe('markActionAsCompleted', () => {
    it('should set an action status to completed', async () => {
      const workflowRunAction: WorkflowRunAction = plainToClass(WorkflowRunAction, {
        _id: new ObjectID(),
        integrationName: 'test',
        operationName: 'test',
        workflowAction: new ObjectID(),
        status: WorkflowRunStatus.running,
      })
      const workflowRun = await mock.createWorkflowRunDeep({ actionRuns: [workflowRunAction] })
      await service.markActionAsCompleted(new ObjectID(), workflowRun._id, workflowRunAction)
      const updated = await service.findById(workflowRun.id)
      expect(updated?.operationsUsed).toBe(1)
      expect(updated?.status).toBe(WorkflowRunStatus.running)
      expect(updated?.actionRuns).toHaveLength(1)
      expect(updated?.actionRuns[0].status).toBe(WorkflowRunStatus.completed)
    })
  })

  describe('markActionAsFailed', () => {
    it('should set the action status and workflow status to failed', async () => {
      const workflowRunAction: WorkflowRunAction = plainToClass(WorkflowRunAction, {
        _id: new ObjectID(),
        integrationName: 'test',
        operationName: 'test',
        workflowAction: new ObjectID(),
        status: WorkflowRunStatus.running,
      })
      const workflowRun = await mock.createWorkflowRunDeep({ actionRuns: [workflowRunAction] })
      await service.markActionAsFailed(new ObjectID(), workflowRun, workflowRunAction, 'error message', 'response')
      const updated = await service.findById(workflowRun.id)
      expect(updated?.operationsUsed).toBe(1)
      expect(updated?.status).toBe(WorkflowRunStatus.failed)
      expect(updated?.actionRuns).toHaveLength(1)
      expect(updated?.actionRuns[0].status).toBe(WorkflowRunStatus.failed)
      expect(updated?.errorMessage).toBe('error message')
      expect(updated?.errorResponse).toBe('response')
    })
  })

  describe('wakeUpWorkflowRun', () => {
    it('should set the workflow run status to running', async () => {
      const workflowRun = await mock.createWorkflowRunDeep()
      await service.wakeUpWorkflowRun(workflowRun)
      const updated = await service.findById(workflowRun.id)
      expect(updated?.status).toBe(WorkflowRunStatus.running)
    })
  })
})
