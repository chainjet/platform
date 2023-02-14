import { NestFactory } from '@nestjs/core'
import { BlockchainListenerModule } from './blockchain-listener.module'

async function bootstrap() {
  const app = await NestFactory.create(BlockchainListenerModule)
  await app.listen(process.env.PORT ?? 8300)
}
bootstrap()
