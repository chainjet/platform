import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationAccount } from '../entities/integration-account'
import { IntegrationAccountService } from './integration-account.service'

describe('IntegrationAccountService', () => {
  let service: IntegrationAccountService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([IntegrationAccount]), MockModule],
      providers: [IntegrationAccountService],
    }).compile()

    service = testModule.get<IntegrationAccountService>(IntegrationAccountService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
