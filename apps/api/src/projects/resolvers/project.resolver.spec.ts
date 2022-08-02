import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { Project } from '../entities/project'
import { ProjectService } from '../services/project.service'
import { ProjectAuthorizer, ProjectResolver } from './project.resolver'

describe('ProjectResolver', () => {
  let resolver: ProjectResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([Project]), MockModule],
      providers: [ProjectResolver, ProjectService, ProjectAuthorizer],
    }).compile()

    resolver = module.get<ProjectResolver>(ProjectResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
