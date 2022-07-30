import { Test, TestingModule } from '@nestjs/testing'
import { RunnerModule } from '../src/runner.module'

describe('Runner App (e2e)', () => {
  let app

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [RunnerModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
  })
})
