import { NestFactory } from '@nestjs/core'
import { MigrationsModule } from './migrations.module'

async function bootstrap() {
  const app = await NestFactory.create(MigrationsModule)
  await app.init()
  await app.close()
}
bootstrap()
