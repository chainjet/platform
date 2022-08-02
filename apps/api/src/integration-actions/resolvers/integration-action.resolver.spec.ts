import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationAction } from '../entities/integration-action'
import { IntegrationActionService } from '../services/integration-action.service'
import { IntegrationActionResolver } from './integration-action.resolver'

describe('IntegrationActionResolver', () => {
  let resolver: IntegrationActionResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([IntegrationAction]), MockModule],
      providers: [IntegrationActionResolver, IntegrationActionService],
    }).compile()

    resolver = module.get<IntegrationActionResolver>(IntegrationActionResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
