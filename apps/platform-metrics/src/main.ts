import { NestFactory } from '@nestjs/core'
import { PlatformMetricsModule } from './platform-metrics.module'

async function bootstrap() {
  const app = await NestFactory.create(PlatformMetricsModule)
  await app.listen(3012)
}
bootstrap()
