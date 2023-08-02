import { mapXmtpMessageToOutput } from '@app/definitions/integration-definitions/xmtp/xmtp.common'
import { XmtpLib } from '@app/definitions/integration-definitions/xmtp/xmtp.lib'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
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

  private integration: Integration
  private integrationTrigger: IntegrationTrigger

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

  async onModuleInit() {
    this.logger.log(`Starting XMTP events listener`)
    await this.fetchIntegrationData()
    this.startXmtpListener()
  }

  async fetchIntegrationData() {
    this.integration = (await this.integrationService.findOne({ key: 'xmtp', version: '1' })) as Integration
    if (!this.integration) {
      throw new Error(`XMTP integration not found`)
    }
    this.integrationTrigger = (await this.integrationTriggerService.findOne({
      key: 'newMessage',
      integration: this.integration.id,
    })) as IntegrationTrigger
    if (!this.integrationTrigger) {
      throw new Error(`newMessage trigger from XMTP integration not found`)
    }
  }

  // TODO we need the interval to start listening for new triggers after the server has started.
  //      it could be more efficient if the api notifies when this happens rather than polling every 30 seconds.
  @Interval(30 * 1000)
  async startXmtpListener() {
    if (process.env.XMTP_LISTENER_DISABLED === 'true') {
      return
    }

    const workflowTriggers = await this.workflowTriggerService.find({
      integrationTrigger: this.integrationTrigger.id,
      enabled: true,
      planLimited: { $ne: true },
      numberOfActions: { $gt: 0 },
    })
    const triggersWithoutListener = workflowTriggers.filter((trigger) => !this.listeners[trigger.id])
    const shuffledTriggers = shuffle(triggersWithoutListener)

    this.logger.log(`Found ${triggersWithoutListener.length} XMTP new message triggers`)

    // Listen for new messages without blocking the event loop
    for (const workflowTrigger of shuffledTriggers) {
      this.listenForNewMessages(workflowTrigger)
    }
  }

  async listenForNewMessages(workflowTrigger: WorkflowTrigger) {
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
      const client = await XmtpLib.getClient(credentials.keys)

      this.listeners[workflowTrigger._id.toString()] = true

      const streams = await client.conversations.streamAllMessages()

      this.logger.log(`Streaming all messages for workflow ${workflowTrigger.workflow}`)

      for await (const message of streams) {
        // Ignore messages sent by the current user
        if (message.senderAddress === client.address) {
          continue
        }
        const outputs = mapXmtpMessageToOutput(message)
        const hookTriggerOutputs = {
          id: outputs.id,
          outputs: {
            [workflowTrigger.id]: outputs as Record<string, any>,
            trigger: outputs as Record<string, any>,
          },
        }

        await this.workflowUsedIdService.createOne({
          workflow: workflowTrigger.workflow,
          triggerId: outputs.id,
        })
        const rootActions = await this.workflowActionService.find({ workflow: workflow._id, isRootAction: true })
        const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
          this.integration,
          this.integrationTrigger,
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
