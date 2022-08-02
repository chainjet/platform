import { DeepPartial } from '@nestjs-query/core'
import { Test, TestingModule } from '@nestjs/testing'
import { ObjectID } from 'mongodb'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { Project } from '../entities/project'
import { ProjectService } from './project.service'

describe('ProjectService', () => {
  let service: ProjectService
  let mock: MockService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([Project]), MockModule],
      providers: [ProjectService],
    }).compile()

    service = module.get<ProjectService>(ProjectService)
    mock = module.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createOne', () => {
    it('should set a slug from the project name and owner username', async () => {
      const user = await mock.createUser({ username: 'TestUser' })
      const project = await service.createOne({
        name: 'Test Project',
        owner: user.id,
        public: false,
      } as DeepPartial<Project>)
      expect(project.slug).toBe('testuser/test-project')
    })
  })

  describe('updateOne', () => {
    beforeEach(async () => {
      await mock.createProjectDeep({ slug: 'test/test' })
    })

    it('should update the slug if name is changed', async () => {
      await service.updateOne(mock.project.id, { name: 'Updated!' })
      const updated = await service.findById(mock.project.id)
      expect(updated?.slug).toBe('test/updated')
    })

    it('should not update the slug if name is not changed', async () => {
      await service.updateOne(mock.project.id, { public: true })
      const updated = await service.findById(mock.project.id)
      expect(updated?.slug).toBe('test/test')
    })

    it('should update workflow slugs if project name is changed', async () => {
      for (const i of [0, 1, 2]) {
        await mock.createWorkflow({
          name: `workflow-${i}`,
          slug: `test/test/workflow/workflow-${i}`,
        })
      }
      await service.updateOne(mock.project.id, { name: 'Updated!' })
      const workflows = await mock.workflowService.find({ project: mock.project._id })
      expect(workflows.map((workflow) => workflow.slug)).toEqual([
        'test/updated/workflow/workflow-0',
        'test/updated/workflow/workflow-1',
        'test/updated/workflow/workflow-2',
      ])
    })
  })

  describe('deleteOne', () => {
    beforeEach(async () => await mock.createProjectDeep())

    it('should delete a project', async () => {
      await service.deleteOne(mock.project.id)
      expect(await service.findById(mock.project.id)).toBeUndefined()
    })

    it('should delete all workflows belonging to the project', async () => {
      await mock.workflowService.Model.insertMany([
        mock.getInstanceOfWorkflow({
          name: 'workflow-1',
          slug: 'test/test/workflow-1',
        }),
        mock.getInstanceOfWorkflow({
          name: 'workflow-2',
          slug: 'test/test/workflow-2',
        }),
        mock.getInstanceOfWorkflow({
          project: new ObjectID(),
          name: 'workflow-3',
          slug: 'test/test/workflow-3',
        }),
      ])
      await service.deleteOne(mock.project.id)
      expect(await mock.workflowService.find({ project: mock.project.id })).toHaveLength(0)
      expect(await mock.workflowService.find({})).toEqual([expect.objectContaining({ name: 'workflow-3' })])
    })
  })
})
