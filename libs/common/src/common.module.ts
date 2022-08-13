import { Module } from '@nestjs/common'
import { MetricService } from './metrics/metric.service'

@Module({
  providers: [MetricService],
  exports: [MetricService],
})
export class CommonModule {}
