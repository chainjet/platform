import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from '../../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../../libs/common/test/mock.module'
import { OAuthStrategyFactory } from '../oauth-strategy.factory'
import { ExternalOAuthController } from './external-oauth.controller'

describe('ExternalOAuth Controller', () => {
  let controller: ExternalOAuthController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockModule],
      controllers: [ExternalOAuthController],
      providers: [OAuthStrategyFactory]
    }).compile()

    controller = module.get<ExternalOAuthController>(ExternalOAuthController)
  })

  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
