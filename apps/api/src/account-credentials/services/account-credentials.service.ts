import { BaseService } from '@app/common/base/base.service'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DeepPartial, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import CryptoJS from 'crypto-js'
import { InjectModel } from 'nestjs-typegoose'
import { OperationRunnerService } from '../../../../runner/src/services/operation-runner.service'
import { IntegrationAccountService } from '../../integration-accounts/services/integration-account.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { AccountCredential } from '../entities/account-credential'

@Injectable()
export class AccountCredentialService extends BaseService<AccountCredential> {
  protected readonly logger = new Logger(AccountCredential.name)

  constructor(
    @InjectModel(AccountCredential)
    protected readonly model: ReturnModelType<typeof AccountCredential>,
    protected readonly configService: ConfigService,
    protected readonly integrationService: IntegrationService,
    protected readonly integrationAccountService: IntegrationAccountService,
    @Inject(forwardRef(() => OperationRunnerService)) protected operationRunnerService: OperationRunnerService,
  ) {
    super(model)
  }

  async createOne(record: DeepPartial<AccountCredential>): Promise<AccountCredential> {
    const credentials: Record<string, any> = {
      ...(record.credentials ?? {}),
      ...(record.fields ?? {}),
    }

    // Encrypt credentials
    if (record.credentials) {
      const key = this.configService.get('CREDENTIALS_AES_KEY')
      if (!key) {
        throw new Error('Credentials encryption key not set')
      }
      record.encryptedCredentials = CryptoJS.AES.encrypt(JSON.stringify(record.credentials), key).toString()
      delete record.credentials
    }

    const integrationAccount = await this.integrationAccountService.findById(
      record.integrationAccount?.toString() ?? '',
    )
    if (!integrationAccount) {
      throw new Error(`Integration account ${record.integrationAccount} not found`)
    }

    const accountCredential = await super.createOne(record)

    const integrations = await this.integrationService.find({ integrationAccount: integrationAccount._id })
    if (integrations.length === 1) {
      await this.operationRunnerService.runOperationAfterAccountCreated({
        integration: integrations[0],
        integrationAccount,
        accountCredential,
        credentials,
      })
    }

    return accountCredential
  }

  async updateOne(
    id: string,
    update: DeepPartial<AccountCredential>,
    opts?: UpdateOneOptions<AccountCredential>,
  ): Promise<AccountCredential> {
    if (update.credentials) {
      const key = this.configService.get('CREDENTIALS_AES_KEY')
      if (!key) {
        throw new Error('Credentials encryption key not set')
      }
      update.encryptedCredentials = CryptoJS.AES.encrypt(JSON.stringify(update.credentials), key).toString()
      delete update.credentials
    }
    return await super.updateOne(id, update, opts)
  }
}
