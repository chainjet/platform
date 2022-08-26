import { Injectable } from '@nestjs/common'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationActionService } from 'apps/api/src/integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from 'apps/api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'

@Injectable()
export class Migration0002 {
  constructor(
    private integrationAccountService: IntegrationAccountService,
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private integrationActionService: IntegrationActionService,
    private accountCredentialsService: AccountCredentialService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
  ) {}

  async run() {
    const deleteFromUsers = false
    const integrationKey = 'google-sheets'
    const integrationVersion = '4'
    const integrationAccountKey: string | null = null // 'google-sheets'

    const integration = await this.integrationService.findOne({ key: integrationKey, version: integrationVersion })
    if (!integration) {
      console.log(`Integration ${integrationKey} with version ${integrationVersion} not found`)
      return
    }

    // delete integration and workflow triggers (if deleteFromUsers = true)
    const integrationTriggers = await this.integrationTriggerService.find({ integration: integration._id })
    for (const integrationTrigger of integrationTriggers) {
      const workflowTriggers = await this.workflowTriggerService.find({ integrationTrigger: integrationTrigger._id })
      if (deleteFromUsers) {
        for (const workflowTrigger of workflowTriggers) {
          await this.workflowTriggerService.deleteOne(workflowTrigger.id)
          console.log(`Workflow trigger ${workflowTrigger.id} deleted`)
        }
      } else if (workflowTriggers.length) {
        throw new Error(
          `Found ${workflowTriggers.length} workflow triggers using integration trigger ${integrationTrigger._id}`,
        )
      }
      await this.integrationTriggerService.deleteOne(integrationTrigger.id)
      console.log(`Integration trigger ${integrationTrigger.id} deleted`)
    }

    // delete integration and workflow actions (if deleteFromUsers = true)
    const integrationActions = await this.integrationActionService.find({ integration: integration._id })
    for (const integrationAction of integrationActions) {
      const workflowActions = await this.workflowActionService.find({ integrationAction: integrationAction._id })
      if (deleteFromUsers) {
        for (const workflowAction of workflowActions) {
          await this.workflowActionService.deleteOne(workflowAction.id)
          console.log(`Workflow action ${workflowAction.id} deleted`)
        }
      } else if (workflowActions.length) {
        throw new Error(
          `Found ${workflowActions.length} workflow action using integration action ${integrationAction._id}`,
        )
      }
      await this.integrationActionService.deleteOne(integrationAction.id)
      console.log(`Integration action ${integrationAction.id} deleted`)
    }

    if (integrationAccountKey) {
      const integrationAccount = await this.integrationAccountService.findOne({ key: integrationAccountKey })
      if (!integrationAccount) {
        console.log(`Integration account ${integrationAccountKey} not found`)
        return
      }
      const accountCredentials = await this.accountCredentialsService.find({
        integrationAccount: integrationAccount._id,
      })
      if (deleteFromUsers) {
        for (const accountCredential of accountCredentials) {
          await this.accountCredentialsService.deleteOne(accountCredential.id)
          console.log(`Account credential ${accountCredential.id} deleted`)
        }
      } else if (accountCredentials.length) {
        throw new Error(
          `Found ${accountCredentials.length} account credentials using integration account ${integrationAccount._id}`,
        )
      }
      await this.integrationAccountService.deleteOne(integrationAccount.id)
      console.log(`Integration account ${integrationAccount.id} deleted`)
    }

    await this.integrationService.deleteOne(integration.id)
    console.log(`Integration ${integration.id} deleted`)
  }
}
