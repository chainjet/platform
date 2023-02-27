import { NestFactory } from '@nestjs/core'
import { SchedulerModule } from './scheduler.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(SchedulerModule)
  app.enableShutdownHooks()
  await app.listen(process.env.PORT ?? 8100)
  process.on('SIGTERM', () => {
    console.log(`SIGTERM signal received`)
  })
}

void bootstrap()
