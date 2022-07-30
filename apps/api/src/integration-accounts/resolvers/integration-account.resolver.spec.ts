import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { IntegrationAccount } from '../entities/integration-account'
import { IntegrationAccountService } from '../services/integration-account.service'
import { IntegrationAccountResolver } from './integration-account.resolver'

describe('IntegrationAccountResolver', () => {
  let resolver: IntegrationAccountResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([IntegrationAccount]),
        MockModule
      ],
      providers: [IntegrationAccountResolver, IntegrationAccountService]
    }).compile()

    resolver = module.get<IntegrationAccountResolver>(IntegrationAccountResolver)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
