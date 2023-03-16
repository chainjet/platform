import { CacheModule } from '@nestjs/common'
import * as redisStore from 'cache-manager-redis-store'
import { RedisClientOptions } from 'redis'

export function redisForRoot() {
  return CacheModule.register<RedisClientOptions>({
    isGlobal: true,
    store: redisStore as any,
    url: process.env.REDIS_URL,
  })
}
