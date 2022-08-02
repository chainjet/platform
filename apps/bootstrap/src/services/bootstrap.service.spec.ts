import { Test, TestingModule } from '@nestjs/testing'
import { MockModule } from '../../../../libs/common/test/mock.module'
import { BootstrapService } from './bootstrap.service'

describe('BootstrapService', () => {
  let service: BootstrapService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [MockModule],
      providers: [BootstrapService],
    }).compile()

    service = module.get<BootstrapService>(BootstrapService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
