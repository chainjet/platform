import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'
import { Injectable, Logger } from '@nestjs/common'

export interface IMetricData {
  nameSpace: string
  metricName: string
  dimensionName?: string
  dimensionValue?: string
  value?: number
}

@Injectable()
export class MetricService {
  private readonly logger = new Logger(MetricService.name)
  private readonly client = new CloudWatchClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  async emit({ nameSpace, metricName, dimensionName, dimensionValue, value = 1 }: IMetricData) {
    const params = {
      MetricData: [
        {
          MetricName: metricName,
          Dimensions:
            dimensionName && dimensionValue
              ? [
                  {
                    Name: dimensionName,
                    Value: dimensionValue,
                  },
                ]
              : [],
          Unit: 'Count',
          Value: value,
        },
      ],
      Namespace: `ChainJet/${nameSpace}`,
    }
    const command = new PutMetricDataCommand(params)
    try {
      if (process.env.NODE_ENV !== 'development') {
        await this.client.send(command)
      }
    } catch (e) {
      this.logger.error(`failed sending metric to service: ${e.message}`)
    }
  }
}
