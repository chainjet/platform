import { mapXmtpMessageToOutput } from '@app/definitions/integration-definitions/xmtp/xmtp.common'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { Client } from '@xmtp/xmtp-js'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from 'apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from 'apps/api/src/integrations/entities/integration'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import { UserService } from 'apps/api/src/users/services/user.service'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { WorkflowUsedIdService } from 'apps/api/src/workflow-triggers/services/workflow-used-id.service'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { shuffle } from 'lodash'

@Injectable()
export class XmtpListenerService {
  private logger = new Logger(XmtpListenerService.name)

  private listeners: { [key: string]: boolean } = {}

  constructor(
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
    private workflowRunService: WorkflowRunService,
    private workflowUsedIdService: WorkflowUsedIdService,
    private runnerService: RunnerService,
    private accountCredentialService: AccountCredentialService,
    private userService: UserService,
  ) {}

  onModuleInit() {
    this.logger.log(`Starting XMTP events listener`)
    this.startXmtpListener()
  }

  // TODO we need the interval to start listening for new triggers after the server has started.
  //      it could be more efficient if the api notifies when this happens rather than polling every 30 seconds.
  @Interval(30 * 1000)
  async startXmtpListener() {
    if (process.env.XMTP_LISTENER_DISABLED === 'true') {
      return
    }
    const integration = await this.integrationService.findOne({ key: 'xmtp', version: '1' })
    if (!integration) {
      this.logger.error(`XMTP integration not found`)
      return
    }
    const integrationTrigger = await this.integrationTriggerService.findOne({
      key: 'newMessage',
      integration: integration.id,
    })
    if (!integrationTrigger) {
      this.logger.error(`newMessage trigger from XMTP integration not found`)
      return
    }

    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: integrationTrigger.id,
      enabled: true,
      planLimited: { $ne: true },
      numberOfActions: { $gt: 0 },
    })
    const triggersWithoutListener = workflowTriggers.filter((trigger) => !this.listeners[trigger.id])
    const shuffledTriggers = shuffle(triggersWithoutListener)

    this.logger.log(`Found ${triggersWithoutListener.length} XMTP new message triggers`)

    // Listen for new messages without blocking the event loop
    for (const workflowTrigger of shuffledTriggers) {
      this.listenForNewMessages(integration, integrationTrigger, workflowTrigger)
    }
  }

  async listenForNewMessages(
    integration: Integration,
    integrationTrigger: IntegrationTrigger,
    workflowTrigger: WorkflowTrigger,
  ) {
    const workflow = await this.workflowService.findOne({ _id: workflowTrigger.workflow })
    if (!workflow) {
      return
    }
    try {
      const accountCredentials = await this.accountCredentialService.findOne({ _id: workflowTrigger.credentials })
      if (!accountCredentials?.credentials?.keys) {
        this.logger.error(`Missing keys for XMTP on workflow ${workflowTrigger.workflow}`)
        return
      }
      const credentials = accountCredentials.credentials
      const keys = new Uint8Array(credentials.keys.split(',').map((key: string) => Number(key)))
      const client = await Client.create(null, { privateKeyOverride: keys, env: 'production' })

      this.listeners[workflowTrigger._id.toString()] = true

      this.logger.log(`Streaming all messages for workflow ${workflowTrigger.workflow}`)
      for await (const message of await client.conversations.streamAllMessages()) {
        // Ignore messages sent by the current user
        if (message.senderAddress === client.address) {
          continue
        }
        const outputs = mapXmtpMessageToOutput(message)
        const hookTriggerOutputs = {
          id: outputs.id,
          outputs: {
            [workflowTrigger.id]: outputs,
            trigger: outputs,
          },
        }

        await this.workflowUsedIdService.createOne({
          workflow: workflowTrigger.workflow,
          triggerId: outputs.id,
        })
        const rootActions = await this.workflowActionService.find({ workflow: workflow._id, isRootAction: true })
        const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
          integration,
          integrationTrigger,
          workflow,
          workflowTrigger,
          rootActions.length > 0,
        )
        await this.workflowTriggerService.updateById(workflowTrigger._id, {
          lastId: outputs.id,
          lastItem: outputs,
        })
        void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
      }
    } catch (e) {
      this.logger.error(`Error starting XMTP listener for workflow ${workflowTrigger.workflow}: ${e.message}`)
    }
  }
}
