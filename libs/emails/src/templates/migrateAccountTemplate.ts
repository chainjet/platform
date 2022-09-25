import { DEFAULT_EMAIL } from '../email.consts'
import { EmailTemplate } from './emailTemplate'

export class MigrateAccountTemplate implements EmailTemplate {
  name = 'MigrateAccount'
  sendFrom = DEFAULT_EMAIL

  constructor(private readonly email: string, private readonly migrationCode: string) {}

  getSubject(): string {
    return 'Verify your ChainJet account migration'
  }

  getTextBody(): string {
    return ''
  }

  getHtmlBody(): string {
    return `Hello there,<br/><br/>

    At ChainJet, we're working to make the protocol decentralized. For this reason, we migrated our authentication system to use Sign-In with Ethereum.<br/>
    This means no more passwords or trusting centralized account providers. Your wallet is now your identity.<br/><br/>

    
    Please, follow this link to migrate your account:
    ${process.env.FRONTEND_ENDPOINT}/migrate/complete?email=${this.email}&code=${this.migrationCode}<br/><br/>
    
    If you need help, or you'd like to participate in our community, feel free to join our Discord: https://discord.gg/QFnSwqj9YH<br/><br/>
    
    Thanks,<br/>
    ChainJet team.`
  }
}
