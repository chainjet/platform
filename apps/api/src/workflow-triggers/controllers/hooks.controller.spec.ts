import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Request } from 'express'
import { TypegooseModule } from 'nestjs-typegoose'
import supertest from 'supertest'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { IntegrationDefinitionFactory } from '../../../../../libs/definitions/src'
import { WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'
import { HooksController } from './hooks.controller'

describe('Hooks Controller', () => {
  let app: INestApplication
  let controller: HooksController
  let mock: MockService
  let integrationDefinitionFactory: IntegrationDefinitionFactory

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      controllers: [HooksController],
      providers: [WorkflowTriggerService],
      imports: [TypegooseModule.forFeature([WorkflowTrigger]), MockModule, TestDatabaseModule],
    }).compile()

    app = testModule.createNestApplication()
    await app.init()

    controller = testModule.get<HooksController>(HooksController)
    mock = testModule.get<MockService>(MockService)
    integrationDefinitionFactory = testModule.get<IntegrationDefinitionFactory>(IntegrationDefinitionFactory)
  })

  beforeEach(async () => {
    await mock.createUser()
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('receiveHook', () => {
    beforeEach(async () => {
      await mock.createWorkflowTriggerDeep({
        hookId: 'test-hook',
      })
      mock.runnerService.runWorkflowActions = jest.fn(() => Promise.resolve())
    })

    it('should run the workflow if onHookReceived returns true', async () => {
      integrationDefinitionFactory.getDefinition = jest.fn(() => ({
        onHookReceived: () => true,
        onHookReceivedForWorkflowTrigger: () => ({ canContinue: true }),
      })) as jest.Mock

      const res = await supertest(app.getHttpServer()).get(`/hooks/${mock.workflowTrigger.hookId}`).expect(200)

      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Hook successfuly received',
        }),
      )

      const expectedOutputs = {
        id: expect.any(String),
        outputs: {
          [mock.workflowTrigger.id]: {},
          trigger: {},
        },
      }
      const workflowRun = await mock.workflowRunService.findOne({ workflow: mock.workflow })
      expect(mock.runnerService.runWorkflowActions).toHaveBeenCalledWith([], [expectedOutputs], workflowRun)
    })

    it('should merge query params with body params', async () => {
      integrationDefinitionFactory.getDefinition = jest.fn(() => ({
        onHookReceived: () => true,
        onHookReceivedForWorkflowTrigger: (req: Request) => ({
          canContinue: true,
          response: {
            outputs: {
              query: req.query ?? {},
              body: req.body ?? {},
            },
          },
        }),
      })) as jest.Mock

      const res = await supertest(app.getHttpServer())
        .post(`/hooks/${mock.workflowTrigger.hookId}?query1=foo&query2=bar`)
        .send({
          body1: 'foo',
          body2: 'bar',
        })
        .expect(200)

      expect(res.body).toEqual(
        expect.objectContaining({
          message: 'Hook successfuly received',
        }),
      )

      const outputs = {
        query: {
          query1: 'foo',
          query2: 'bar',
        },
        body: {
          body1: 'foo',
          body2: 'bar',
        },
      }
      const expectedOutputs = {
        id: expect.any(String),
        outputs: {
          [mock.workflowTrigger.id]: outputs,
          trigger: outputs,
        },
      }
      const workflowRun = await mock.workflowRunService.findOne({ workflow: mock.workflow })
      expect(mock.runnerService.runWorkflowActions).toHaveBeenCalledWith([], [expectedOutputs], workflowRun)
    })

    it('should not run the workflow if onHookReceived returns false', async () => {
      integrationDefinitionFactory.getDefinition = jest.fn(() => ({
        onHookReceived: () => false,
        onHookReceivedForWorkflowTrigger: () => ({ canContinue: false }),
      })) as jest.Mock

      await supertest(app.getHttpServer()).get(`/hooks/${mock.workflowTrigger.hookId}`).expect(200).expect({})

      expect(mock.runnerService.runWorkflowActions).not.toHaveBeenCalled()
    })

    it('should throw an exception if the hook does not exist', async () => {
      await supertest(app.getHttpServer()).get('/hooks/not-existent-hook').expect(404).expect({
        statusCode: 404,
        message: 'Webhook not found',
        error: 'Not Found',
      })
      expect(mock.runnerService.runWorkflowActions).not.toHaveBeenCalled()
    })
  })
})
