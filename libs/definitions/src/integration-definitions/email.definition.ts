import { SingleIntegrationDefinition } from '@app/definitions/single-integration.definition'
import { SES } from '@aws-sdk/client-ses'
import { RunResponse } from '..'
import { OperationRunOptions } from '../../../../apps/runner/src/services/operation-runner.service'

export class EmailDefinition extends SingleIntegrationDefinition {
  integrationKey = 'email'
  integrationVersion = '1'
  schemaUrl = null

  private readonly client = new SES({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  async run({ inputs, user }: OperationRunOptions): Promise<RunResponse> {
    if (!inputs.subject || !inputs.body || !user?.email) {
      throw new Error('Subject and body are required')
    }

    const params = {
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: inputs.body.replace(/\n/g, '<br/>'),
          },
          Text: {
            Charset: 'UTF-8',
            Data: inputs.body,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: inputs.subject,
        },
      },
      Source: 'no-reply@chainjet.email',
    }
    const res = await this.client.sendEmail(params)
    return {
      outputs: {
        messageId: res.MessageId,
      },
    }
  }
}
