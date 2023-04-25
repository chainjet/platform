import { ObjectID } from '@app/common/utils/mongodb'
import { IntegrationDefinitionFactory } from '@app/definitions'
import { OperationType } from '@app/definitions/types/OperationType'
import { Test, TestingModule } from '@nestjs/testing'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { TypegooseModule } from 'nestjs-typegoose'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { CreateWorkflowActionInput, WorkflowAction } from '../entities/workflow-action'
import { WorkflowActionService } from './workflow-action.service'

describe('WorkflowActionService', () => {
  let service: WorkflowActionService
  let mock: MockService
  let integrationDefinitionFactory: IntegrationDefinitionFactory

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([WorkflowAction]), MockModule],
      providers: [WorkflowActionService],
    }).compile()

    service = testModule.get<WorkflowActionService>(WorkflowActionService)
    mock = testModule.get<MockService>(MockService)
    integrationDefinitionFactory = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  beforeEach(async () => {
    integrationDefinitionFactory.getDefinition = jest.fn(() => mock.getDefinition({}))
    await mock.createIntegrationActionDeep()
    await mock.createUser()
    await mock.createWorkflowDeep()
  })

  function createWorkflowAction(record: DeepPartial<CreateWorkflowActionInput> = {}): Promise<WorkflowAction> {
    return service.createOne({
      owner: mock.user._id,
      workflow: mock.workflow._id,
      integrationAction: mock.integrationAction._id,
      inputs: {},
      ...record,
    })
  }

  describe('createOne', () => {
    it('should create an action on an empty workflow', async () => {
      const workflowAction = await createWorkflowAction()
      const doc = await service.Model.findOne()
      expect(doc?.toObject()).toEqual({
        _id: doc?._id,
        owner: mock.user._id,
        workflow: mock.workflow._id,
        integrationAction: workflowAction.integrationAction,
        name: 'Test Integration Action',
        type: OperationType.OffChain,
        inputs: '{}',
        isRootAction: true,
        nextActions: [],
        __v: 0,
      })
    })

    it('should create an action at the beginning of a workflow', async () => {
      const existentAction = await createWorkflowAction()
      const newAction = await createWorkflowAction({
        nextAction: new ObjectID(existentAction.id),
      })

      const existentActionDoc = (await service.Model.findOne({ _id: new ObjectID(existentAction.id) }))!.toObject()
      const newActionDoc = (await service.Model.findOne({ _id: new ObjectID(newAction.id) }))!.toObject()
      expect(existentActionDoc.isRootAction).toEqual(false)
      expect(existentActionDoc.nextActions).toEqual([])
      expect(newActionDoc.isRootAction).toEqual(true)
      expect(newActionDoc.nextActions).toEqual([{ action: new ObjectID(existentAction.id) }])
    })

    it('should create an action at the end of a workflow', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
      })

      const firstActionDoc = (await service.Model.findOne({ _id: new ObjectID(firstAction.id) }))!.toObject()
      const secondActionDoc = (await service.Model.findOne({ _id: new ObjectID(lastAction.id) }))!.toObject()
      expect(firstActionDoc.isRootAction).toEqual(true)
      expect(firstActionDoc.nextActions).toEqual([{ action: new ObjectID(lastAction.id) }])
      expect(secondActionDoc.isRootAction).toEqual(false)
      expect(secondActionDoc.nextActions).toEqual([])
    })

    it('should create an action in between 2 actions', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
      })
      const middleAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
        nextAction: new ObjectID(lastAction.id),
      })

      const firstActionDoc = (await service.Model.findOne({ _id: new ObjectID(firstAction.id) }))!.toObject()
      const middleActionDoc = (await service.Model.findOne({ _id: new ObjectID(middleAction.id) }))!.toObject()
      const lastActionDoc = (await service.Model.findOne({ _id: new ObjectID(lastAction.id) }))!.toObject()
      expect(firstActionDoc.isRootAction).toEqual(true)
      expect(firstActionDoc.nextActions).toEqual([{ action: new ObjectID(middleAction.id) }])
      expect(middleActionDoc.isRootAction).toEqual(false)
      expect(middleActionDoc.nextActions).toEqual([{ action: new ObjectID(lastAction.id) }])
      expect(lastActionDoc.isRootAction).toEqual(false)
      expect(lastActionDoc.nextActions).toEqual([])
    })

    it('should create an action with a condition', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
        previousActionCondition: 'test condition',
      })

      const firstActionDoc = (await service.Model.findOne({ _id: new ObjectID(firstAction.id) }))!.toObject()
      expect(firstActionDoc.isRootAction).toEqual(true)
      expect(firstActionDoc.nextActions).toEqual([
        {
          action: new ObjectID(lastAction.id),
          condition: 'test condition',
        },
      ])
    })

    it('should set the trigger next check if creating a root action', async () => {
      Date.now = jest.fn(() => new Date('2020-01-01 00:00').getTime())

      const integrationTrigger = await mock.createIntegrationTrigger()
      const trigger = await mock.createWorkflowTrigger({
        integrationTrigger: integrationTrigger._id,
        schedule: {
          frequency: 'interval',
          interval: 300,
        },
        inputs: {},
      })
      await createWorkflowAction()
      const updatedTrigger = await mock.workflowTriggerService.findById(trigger.id)
      expect(updatedTrigger?.nextCheck).toEqual(new Date('2020-01-01 00:05'))
    })

    it('should not update the trigger next check if creating a non root action', async () => {
      Date.now = jest.fn(() => new Date('2020-01-01 00:00').getTime())

      const trigger = await mock.createWorkflowTrigger({
        integrationTrigger: new ObjectID(),
        schedule: {
          frequency: 'interval',
          interval: 300,
        },
        inputs: {},
      })
      const firstAction = await createWorkflowAction()
      await mock.workflowTriggerService.updateOneNative({ _id: trigger._id }, { nextCheck: null })
      await createWorkflowAction({ previousAction: new ObjectID(firstAction.id) })
      const updatedTrigger = await mock.workflowTriggerService.findById(trigger.id)
      expect(updatedTrigger?.nextCheck).toBeNull()
    })
  })

  describe('deleteOne', () => {
    it('should delete the only action in a workflow', async () => {
      const workflowAction = await createWorkflowAction()
      await service.deleteOne(workflowAction.id)

      expect(await service.Model.find({ workflow: new ObjectID(mock.workflow.id) })).toHaveLength(0)
    })

    it('should remove the first action in a workflow', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
      })
      await service.deleteOne(firstAction.id)

      const lastActionDoc = (await service.Model.findOne({ _id: new ObjectID(lastAction.id) }))!.toObject()
      expect(lastActionDoc.isRootAction).toEqual(true)
      expect(lastActionDoc.nextActions).toEqual([])
    })

    it('should remove the last action in a workflow', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
      })
      await service.deleteOne(lastAction.id)

      const firstActionDoc = (await service.Model.findOne({ _id: new ObjectID(firstAction.id) }))!.toObject()
      expect(firstActionDoc.isRootAction).toEqual(true)
      expect(firstActionDoc.nextActions).toEqual([])
    })

    it('should remove an action between 2 actions', async () => {
      const firstAction = await createWorkflowAction()
      const lastAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
      })
      const middleAction = await createWorkflowAction({
        previousAction: new ObjectID(firstAction.id),
        nextAction: new ObjectID(lastAction.id),
      })
      await service.deleteOne(middleAction.id)

      const firstActionDoc = (await service.Model.findOne({ _id: new ObjectID(firstAction.id) }))!.toObject()
      const lastActionDoc = (await service.Model.findOne({ _id: new ObjectID(lastAction.id) }))!.toObject()
      expect(firstActionDoc.isRootAction).toEqual(true)
      expect(firstActionDoc.nextActions).toEqual([{ action: new ObjectID(lastAction.id) }])
      expect(lastActionDoc.isRootAction).toEqual(false)
      expect(lastActionDoc.nextActions).toEqual([])
    })
  })
})
