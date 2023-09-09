import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { Redis as RedisType } from 'ioredis'

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly client: RedisType

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL')
    if (!redisUrl) {
      throw new Error('Redis URL not defined')
    }

    this.client = new Redis(redisUrl)
  }

  onModuleDestroy(): void {
    this.client.quit()
  }

  publish(channel: string, message: string) {
    return this.client.publish(channel, message)
  }

  subscribe(channel: string, callback: (channel: string, message: any) => void) {
    return this.client.on(channel, callback)
  }
}
