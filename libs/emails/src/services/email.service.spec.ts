import { Test, TestingModule } from '@nestjs/testing'
import AWS, { SES } from 'aws-sdk'
import AWSMock from 'aws-sdk-mock'
import { EmailVerificationTemplate } from '../templates/emailVerificationTemplate'
import { EmailService } from './email.service'

describe('EmailService', () => {
  let service: EmailService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService]
    }).compile()

    service = module.get<EmailService>(EmailService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('sendEmailTemplate', () => {
    it('should send an email with a template', async () => {
      const mockSendEmail = jest.fn((params: SES.Types.SendEmailRequest, callback: Function) => {
        callback(null, { MessageId: '123' })
      })
      AWSMock.setSDKInstance(AWS)
      AWSMock.mock('SES', 'sendEmail', mockSendEmail)
      const template = new EmailVerificationTemplate('username', 'code')
      await service.sendEmailTemplate(template, 'example@example.org')

      expect(mockSendEmail).toHaveBeenCalledWith({
        Destination: {
          ToAddresses: ['example@example.org']
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: template.getHtmlBody()
            },
            Text: {
              Charset: 'UTF-8',
              Data: template.getTextBody()
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: template.getSubject()
          }
        },
        Source: template.sendFrom,
        ReplyToAddresses: [template.sendFrom]
      }, expect.any(Function))
    })
  })
})
