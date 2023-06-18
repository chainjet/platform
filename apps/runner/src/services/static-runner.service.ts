import { IntegrationDefinitionFactory, RunResponse, SingleIntegrationDefinition, StepInputs } from '@app/definitions'
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common'
import { AccountCredential } from 'apps/api/src/account-credentials/entities/account-credential'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationActionService } from 'apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import mongoose from 'mongoose'
import { OperationRunnerService } from './operation-runner.service'

type StaticRunOptions = {
  definition: SingleIntegrationDefinition
  actionKey: string
  inputs: StepInputs
  accountCredential?: AccountCredential | mongoose.Types.ObjectId | string | null
}

@Injectable()
export class StaticRunner {
  protected readonly logger: Logger = new Logger(StaticRunner.name)
  static instance: StaticRunner

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integrationActionService: IntegrationActionService,
    private readonly integrationAccountService: IntegrationAccountService,
    @Inject(forwardRef(() => OperationRunnerService)) protected operationRunnerService: OperationRunnerService,
    @Inject(forwardRef(() => AccountCredentialService)) protected accountCredentialService: AccountCredentialService,
    @Inject(forwardRef(() => IntegrationDefinitionFactory))
    public integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {
    StaticRunner.instance = this
  }

  async runAction({ definition, actionKey, inputs, accountCredential: credentialsOrId }: StaticRunOptions) {
    const integrationKey = definition.integrationKey
    const integrationVersion = definition.integrationVersion
    this.logger.debug(`Running static action ${integrationKey}/${integrationVersion}/${actionKey}`)

    const integration = await this.integrationService.findOne({ key: integrationKey, version: integrationVersion })
    if (!integration) {
      throw new Error(`Integration ${integrationKey} with version ${integrationVersion} not found`)
    }
    const integrationAction = await this.integrationActionService.findOne({
      integration: integration.id,
      key: actionKey,
    })
    if (!integrationAction) {
      throw new Error(`Integration action ${actionKey} not found on integration id ${integration.id}`)
    }

    let accountCredential: AccountCredential | null = null
    if (credentialsOrId) {
      if (typeof credentialsOrId === 'string' || !('credentials' in credentialsOrId)) {
        accountCredential = (await this.accountCredentialService.findById(credentialsOrId.toString())) ?? null
      } else {
        accountCredential = credentialsOrId
      }
    }

    const integrationAccount =
      accountCredential &&
      (await this.integrationAccountService.findById(accountCredential.integrationAccount.toString()))

    return await this.operationRunnerService.runAction(definition, {
      integration,
      integrationAccount: integrationAccount ?? null,
      inputs,
      credentials: accountCredential?.credentials ?? {},
      accountCredential,
      operation: integrationAction,
    })
  }

  static async run(opts: StaticRunOptions): Promise<RunResponse> {
    return StaticRunner.instance.runAction(opts)
  }
}
