import { NestFactory } from '@nestjs/core'
import { RunnerModule } from './runner.module'

async function bootstrap (): Promise<void> {
  await NestFactory.create(RunnerModule)
  // await app.listen(process.env.PORT || 8200)
}

void bootstrap()
