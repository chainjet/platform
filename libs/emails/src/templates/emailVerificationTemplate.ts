import { NO_REPLY_EMAIL } from '../email.consts'
import { EmailTemplate } from './emailTemplate'

export class EmailVerificationTemplate implements EmailTemplate {
  name = 'EmailVerification'
  sendFrom = NO_REPLY_EMAIL

  constructor(private readonly username: string, private readonly verificationCode: string) {}

  getSubject(): string {
    return 'Verify your email for ChainJet'
  }

  getTextBody(): string {
    return ''
  }

  getHtmlBody(): string {
    return `Thank you for creating an account on <a href="https://chainjet.io">ChainJet</a>.<br/><br/>

    Follow this link to verify your email:
    ${process.env.ENDPOINT}/register/complete-signup?username=${this.username}&code=${this.verificationCode}`
  }
}
