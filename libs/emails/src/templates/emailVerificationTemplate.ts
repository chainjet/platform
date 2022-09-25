import { DEFAULT_EMAIL } from '../email.consts'
import { EmailTemplate } from './emailTemplate'

/**
 * @deprecated
 */
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
    return `Thank you for creating an account on <a href="https://chainjet.io">ChainJet</a>.<br/><br/>

    Follow this link to verify your email:
    ${process.env.FRONTEND_ENDPOINT}/register/complete-signup?address=${this.address}&code=${this.verificationCode}`
  }
}
