import { DEFAULT_EMAIL } from '../email.consts'
import { EmailTemplate } from './emailTemplate'

export class EmailVerificationTemplate implements EmailTemplate {
  name = 'EmailVerification'
  sendFrom = DEFAULT_EMAIL

  constructor(private readonly address: string, private readonly verificationCode: string) {}

  getSubject(): string {
    return 'Verify your email for ChainJet'
  }

  getTextBody(): string {
    return ''
  }

  getHtmlBody(): string {
    return `Thank you being part of on <a href="https://chainjet.io">ChainJet</a>.<br/><br/>

    Follow this link to verify your email:
    ${process.env.FRONTEND_ENDPOINT}/verify-email?address=${this.address}&code=${this.verificationCode}`
  }
}
