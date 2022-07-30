import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap (): Promise<void> {
  const app = await NestFactory.create(AppModule)
  await app.listen(process.env.PORT ?? 8000)
}

void bootstrap()
