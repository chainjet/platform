import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { Redis as RedisType } from 'ioredis'

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly client: RedisType
  private readonly subscriber: RedisType

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL')
    if (!redisUrl) {
      throw new Error('Redis URL not defined')
    }

    this.client = new Redis(redisUrl)
    this.subscriber = new Redis(redisUrl) // creating a separate instance for subscribing
  }

  onModuleDestroy(): void {
    this.client.quit()
    this.subscriber.quit()
  }

  publish(channel: string, message: string) {
    return this.client.publish(channel, message)
  }

  subscribe(channel: string, callback: (channel: string, message: any) => void) {
    this.subscriber.subscribe(channel)
    this.subscriber.on('message', (chan: string, message: string) => {
      if (chan === channel) {
        callback(chan, message)
      }
    })
  }
}
