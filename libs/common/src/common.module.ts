import { Module } from '@nestjs/common'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { UserEvent } from './metrics/entities/user-event'
import { MetricService } from './metrics/metric.service'
import { UserEventService } from './metrics/user-event.service'
import { NestjsQueryTypegooseModule } from './NestjsQueryTypegooseModule'

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [NestjsQueryTypegooseModule.forFeature([UserEvent])],
      dtos: [{ DTOClass: UserEvent }],
    }),
  ],
  providers: [MetricService, UserEventService],
  exports: [MetricService, UserEventService],
})
export class CommonModule {}
