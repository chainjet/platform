import { BaseService } from '@app/common/base/base.service'
import { Definition } from '@app/definitions'
import { IntegrationAuthType } from '@app/definitions/types/IntegrationAuthDefinition'
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DeepPartial, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import CryptoJS from 'crypto-js'
import { InjectModel } from 'nestjs-typegoose'
import { OperationRunnerService } from '../../../../runner/src/services/operation-runner.service'
import { OAuthStrategyFactory } from '../../auth/external-oauth/oauth-strategy.factory'
import { IntegrationAccountService } from '../../integration-accounts/services/integration-account.service'
import { Integration } from '../../integrations/entities/integration'
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
    private readonly oauthStrategyFactory: OAuthStrategyFactory,
  ) {
    super(model)
  }

  async createOne(record: DeepPartial<AccountCredential>): Promise<AccountCredential> {
    const credentials: Record<string, any> = {
      ...(record.credentialInputs ?? {}),
      ...(record.fields ?? {}),
    }

    // Encrypt credentials
    if (record.credentialInputs) {
      record.credentials = record.credentialInputs
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
    if (update.credentialInputs) {
      const key = this.configService.get('CREDENTIALS_AES_KEY')
      if (!key) {
        throw new Error('Credentials encryption key not set')
      }
      update.encryptedCredentials = CryptoJS.AES.encrypt(JSON.stringify(update.credentialInputs), key).toString()
      update.lastCredentialUpdate = new Date()
    }
    return await super.updateOne(id, update, opts)
  }

  async refreshCredentials(
    accountCredential: AccountCredential,
    definition: Definition,
    integration: Integration,
  ): Promise<AccountCredential | null> {
    // refresh credentials with custom refresh logic set in the definition
    const refreshedCredentials = await definition.refreshCredentials(accountCredential.credentials)
    if (refreshedCredentials) {
      if (
        refreshedCredentials.accessToken !== accountCredential.credentials.accessToken ||
        refreshedCredentials.refreshToken !== accountCredential.credentials.refreshToken
      ) {
        const newCredentials = {
          ...accountCredential.credentials,
          ...refreshedCredentials,
        }
        return await this.updateOne(accountCredential._id.toString(), {
          credentialInputs: newCredentials,
          authExpired: false,
        })
      }
      return null
    }
    if (!integration.integrationAccount) {
      return null
    }
    const integrationAccount = await this.integrationAccountService.findById(
      integration.integrationAccount._id.toString(),
    )
    if (!integrationAccount) {
      return null
    }

    // refresh credentials for standard oauth integrations
    if (integrationAccount.authType === IntegrationAuthType.oauth2) {
      await this.oauthStrategyFactory.refreshOauth2AccessToken(
        integrationAccount.key,
        accountCredential,
        accountCredential.credentials,
      )
      return (await this.findById(accountCredential._id.toString())) ?? null
    }

    return null
  }
}
