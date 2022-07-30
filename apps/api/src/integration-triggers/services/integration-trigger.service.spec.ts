import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationTrigger } from '../entities/integration-trigger'
import { IntegrationTriggerService } from './integration-trigger.service'

describe('IntegrationTriggerService', () => {
  let service: IntegrationTriggerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([IntegrationTrigger]),
        MockModule
      ],
      providers: [IntegrationTriggerService]
    }).compile()

    service = module.get<IntegrationTriggerService>(IntegrationTriggerService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
