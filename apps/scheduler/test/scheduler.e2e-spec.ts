import { Test, TestingModule } from '@nestjs/testing'
import { SchedulerModule } from '../src/scheduler.module'

describe('Scheduler App (e2e)', () => {
  let app

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SchedulerModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('should be defined', () => {
    expect(app).toBeDefined()
  })
})
