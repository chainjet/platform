import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationAction } from '../entities/integration-action'
import { IntegrationActionService } from './integration-action.service'

describe('IntegrationActionService', () => {
  let service: IntegrationActionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([IntegrationAction]), MockModule],
      providers: [IntegrationActionService],
    }).compile()

    service = module.get<IntegrationActionService>(IntegrationActionService)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
