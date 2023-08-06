import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { NestjsQueryTypegooseModule } from './NestjsQueryTypegooseModule'
import { RedisPubSubService } from './cache/redis-pubsub.service'
import { StaticCacheManagerService } from './cache/static-cache-manager.service'
import { UserEvent } from './metrics/entities/user-event'
import { MetricService } from './metrics/metric.service'
import { UserEventService } from './metrics/user-event.service'
import { SubscriptionService } from './subscriptions/subscription.service'

@Module({
  imports: [
    ConfigModule.forRoot(),
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([UserEvent])],
      dtos: [{ DTOClass: UserEvent }],
    }),
  ],
  providers: [MetricService, UserEventService, SubscriptionService, StaticCacheManagerService, RedisPubSubService],
  exports: [MetricService, UserEventService, SubscriptionService, StaticCacheManagerService, RedisPubSubService],
})
export class CommonModule {}
