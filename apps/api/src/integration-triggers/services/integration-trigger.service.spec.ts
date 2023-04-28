import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationTrigger } from '../entities/integration-trigger'
import { IntegrationTriggerService } from './integration-trigger.service'

describe('IntegrationTriggerService', () => {
  let service: IntegrationTriggerService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([IntegrationTrigger]), MockModule],
      providers: [IntegrationTriggerService],
    }).compile()

    service = testModule.get<IntegrationTriggerService>(IntegrationTriggerService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
