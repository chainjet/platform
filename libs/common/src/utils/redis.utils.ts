import { BullModule } from '@nestjs/bull'
import { CacheModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { caching } from 'cache-manager'
import { redisStore } from 'cache-manager-redis-store'
import Redis from 'ioredis'
import { RedisClientOptions } from 'redis'

export function redisForRoot() {
  return CacheModule.registerAsync<RedisClientOptions>({
    isGlobal: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      if (configService.get<string>('NODE_ENV') === 'test') {
        return (await caching('memory', {
          max: 100,
          ttl: 1000 * 60,
        })) as any
      }
      const store = await redisStore({
        url: configService.get<string>('REDIS_URL'),
        pingInterval: 1000 * 60 * 4,
      })
      return store as unknown as RedisClientOptions
    },
  })
}

export function bullForRoot() {
  return BullModule.forRoot({
    createClient: () => {
      return new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        ...(process.env.NODE_ENV === 'development' ? {} : { tls: {} }),
      })
    },
  })
}
