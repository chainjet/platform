import { SES } from '@aws-sdk/client-ses'
import { Injectable, Logger } from '@nestjs/common'
import { EmailTemplate } from '../templates/emailTemplate'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly client = new SES({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  async sendEmailTemplate(template: EmailTemplate, toAddress: string): Promise<void> {
    const params = {
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: template.getHtmlBody(),
          },
          Text: {
            Charset: 'UTF-8',
            Data: template.getTextBody(),
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: template.getSubject(),
        },
      },
      Source: template.sendFrom,
      ReplyToAddresses: [template.sendFrom],
    }

    try {
      const res = await this.client.sendEmail(params)
      this.logger.log(`Sent ${template.name} email with ID "${res.MessageId}"`)
    } catch (e) {
      this.logger.error(`Error sending ${template.name} email to ${toAddress} - error: ${e.message}`)
    }
  }
}
