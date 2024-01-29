import { LensLib } from '@app/definitions/integration-definitions/lens/lens.lib'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'

@Injectable()
export class AccountRefreshSchedulerService {
  private readonly logger = new Logger(AccountRefreshSchedulerService.name)
  private processInterrupted: boolean = false

  constructor(
    private readonly integrationAccountService: IntegrationAccountService,
    private readonly accountCredentialsService: AccountCredentialService,
  ) {}

  onModuleDestroy() {
    this.logger.log('Process interrupted, stopping schedulers')
    this.processInterrupted = true
  }

  @Interval(1000 * 60 * 60 * 3)
  async scheduleRefreshAccounts(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processInterrupted) {
      await this.refreshAccounts()
    }
  }

  async refreshAccounts(): Promise<void> {
    // Refresh Lens credentials
    this.logger.log(`Refreshing Lens credentials`)
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    const thertyDaysAgo = new Date()
    thertyDaysAgo.setDate(thertyDaysAgo.getDate() - 30)

    const lensAccount = await this.integrationAccountService.findOne({ key: 'lens' })
    const accounts = await this.accountCredentialsService.find({
      integrationAccount: lensAccount!._id,
      lastCredentialUpdate: {
        $exists: true,
        $lte: fiveDaysAgo,
        $gte: thertyDaysAgo,
      },
    })
    for (const account of accounts) {
      try {
        const newCredentials = await LensLib.getRefreshedAccountCredentials(account)
        if (newCredentials) {
          account.credentialInputs = {
            ...account.credentials,
            ...newCredentials,
          }
          await this.accountCredentialsService.updateOne(account.id, account)
        } else {
          this.logger.error(`Could not refresh credentials for Lens account ${account.name} ${account._id}`)
          await this.accountCredentialsService.updateOneNative(
            { _id: account._id },
            {
              authExpired: true,
            },
          )
        }
      } catch (e) {
        this.logger.error(`Error refreshing credentials for Lens account ${account.name} ${account._id}`, e)
      }
    }
  }
}
