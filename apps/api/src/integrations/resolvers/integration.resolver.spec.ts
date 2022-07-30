import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { Integration } from '../entities/integration'
import { IntegrationResolver } from './integration.resolver'

describe('IntegrationResolver', () => {
  let resolver: IntegrationResolver

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([Integration]),
        MockModule
      ],
      providers: [IntegrationResolver]
    }).compile()

    resolver = module.get<IntegrationResolver>(IntegrationResolver)
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })
})
