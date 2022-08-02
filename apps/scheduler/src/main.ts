import { NestFactory } from '@nestjs/core'
import { SchedulerModule } from './scheduler.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(SchedulerModule)
  await app.listen(process.env.PORT ?? 8100)
}

void bootstrap()
