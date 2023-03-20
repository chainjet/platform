import { CacheModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-redis-store'
import { RedisClientOptions } from 'redis'

export function redisForRoot() {
  return CacheModule.registerAsync<RedisClientOptions>({
    isGlobal: true,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const store = await redisStore({
        url: configService.get<string>('REDIS_URL'),
        pingInterval: 1000 * 60 * 4,
      })
      return store as unknown as RedisClientOptions
    },
  })
}
