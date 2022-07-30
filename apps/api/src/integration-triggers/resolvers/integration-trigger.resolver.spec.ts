import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationTrigger } from '../entities/integration-trigger'
import { IntegrationTriggerService } from '../services/integration-trigger.service'
import { IntegrationTriggerResolver } from './integration-trigger.resolver'

describe('IntegrationTriggerResolver', () => {
  let resolver: IntegrationTriggerResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([IntegrationTrigger]),
        MockModule
      ],
      providers: [IntegrationTriggerResolver, IntegrationTriggerService]
    }).compile()

    resolver = module.get<IntegrationTriggerResolver>(IntegrationTriggerResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
