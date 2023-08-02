import { XmtpMessageOutput, mapXmtpMessageToOutput } from '@app/definitions/integration-definitions/xmtp/xmtp.common'
import { XmtpLib } from '@app/definitions/integration-definitions/xmtp/xmtp.lib'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { Client, DecodedMessage } from '@xmtp/xmtp-js'
import { AccountCredentialService } from 'apps/api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccount } from 'apps/api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from 'apps/api/src/integration-accounts/services/integration-account.service'
import { IntegrationTrigger } from 'apps/api/src/integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from 'apps/api/src/integration-triggers/services/integration-trigger.service'
import { Integration } from 'apps/api/src/integrations/entities/integration'
import { IntegrationService } from 'apps/api/src/integrations/services/integration.service'
import { WorkflowActionService } from 'apps/api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRunStatus } from 'apps/api/src/workflow-runs/entities/workflow-run-status'
import { WorkflowSleep } from 'apps/api/src/workflow-runs/entities/workflow-sleep'
import { WorkflowRunService } from 'apps/api/src/workflow-runs/services/workflow-run.service'
import { WorkflowSleepService } from 'apps/api/src/workflow-runs/services/workflow-sleep.service'
import { WorkflowTrigger } from 'apps/api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from 'apps/api/src/workflow-triggers/services/workflow-trigger.service'
import { WorkflowUsedIdService } from 'apps/api/src/workflow-triggers/services/workflow-used-id.service'
import { Workflow } from 'apps/api/src/workflows/entities/workflow'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'
import { RunnerService } from 'apps/runner/src/services/runner.service'
import { shuffle } from 'lodash'
import { Types } from 'mongoose'

@Injectable()
export class ChatbotListenerService {
  private logger = new Logger(ChatbotListenerService.name)

  private listeners: { [key: string]: boolean } = {}

  private integration: Integration
  private integrationTrigger: IntegrationTrigger
  private integrationAccount: IntegrationAccount

  constructor(
    private integrationService: IntegrationService,
    private integrationTriggerService: IntegrationTriggerService,
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
    private workflowRunService: WorkflowRunService,
    private workflowUsedIdService: WorkflowUsedIdService,
    private workflowSleepService: WorkflowSleepService,
    private runnerService: RunnerService,
    private accountCredentialService: AccountCredentialService,
    private integrationAccountService: IntegrationAccountService,
  ) {}

  async onModuleInit() {
    this.logger.log(`Starting XMTP events listener`)
    await this.fetchIntegrationData()
    this.startXmtpListener()
  }

  async fetchIntegrationData() {
    this.integration = (await this.integrationService.findOne({ key: 'chatbot', version: '1' })) as Integration
    if (!this.integration) {
      throw new Error(`Chatbot integration not found`)
    }
    this.integrationTrigger = (await this.integrationTriggerService.findOne({
      key: 'newChatbotMessage',
      integration: this.integration.id,
    })) as IntegrationTrigger
    if (!this.integrationTrigger) {
      throw new Error(`Chatbot integration not found`)
    }
    this.integrationAccount = (await this.integrationAccountService.findOne({ key: 'xmtp' })) as IntegrationAccount
    if (!this.integrationAccount) {
      throw new Error(`XMTP integration account not found`)
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
      const accountCredentials = await this.accountCredentialService.findOne({
        owner: workflow.owner,
        integrationAccount: this.integrationAccount._id,
      })
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
        try {
          await this.processMessage(workflow, workflowTrigger, message, client)
        } catch (e) {
          this.logger.error(`Error processing XMTP message for workflow ${workflowTrigger.workflow}: ${e.message}`)
        }
      }
    } catch (e) {
      this.logger.error(`Error starting XMTP listener for workflow ${workflowTrigger.workflow}: ${e.message}`)
    }
  }

  async processMessage(workflow: Workflow, workflowTrigger: WorkflowTrigger, message: DecodedMessage, client: Client) {
    // Ignore messages sent by the current user
    if (message.senderAddress === client.address) {
      return
    }

    await this.workflowUsedIdService.createOne({
      workflow: workflowTrigger.workflow,
      triggerId: message.id,
    })

    const outputs = mapXmtpMessageToOutput(message)

    const workflowSleeps = await this.workflowSleepService.find({
      workflow: workflowTrigger.workflow,
      uniqueGroup: outputs.conversation.id,
    })

    // continue previous conversation
    if (workflowSleeps.length > 0) {
      void this.continueConversation(workflow, workflowTrigger, workflowSleeps, outputs)
      return
    }

    const hookTriggerOutputs = {
      id: outputs.id,
      outputs: {
        [workflowTrigger.id]: outputs as Record<string, any>,
        trigger: outputs as Record<string, any>,
        contact: {
          address: outputs.senderAddress,
        },
      },
    }
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

  async continueConversation(
    workflow: Workflow,
    workflowTrigger: WorkflowTrigger,
    workflowSleeps: WorkflowSleep[],
    outputs: XmtpMessageOutput,
  ) {
    const workflowSleep = workflowSleeps[0]

    // clean up
    await this.workflowSleepService.deleteManyNative({
      _id: {
        $in: workflowSleeps.map((workflowSleep) => workflowSleep._id),
      },
    })

    this.logger.log(`Continuing chatbot conversation ${workflowSleep.id} for workflow ${workflowTrigger.workflow}`)

    const workflowAction = await this.workflowActionService.findById(workflowSleep.workflowAction.toString())
    const workflowRun = await this.workflowRunService.findById(workflowSleep.workflowRun.toString())

    if (!workflowAction || !workflowRun) {
      this.logger.error(`Missing workflow action or workflow run for workflow sleep ${workflowSleep.id}`)
      await this.workflowRunService.updateById(workflowSleep._id, { status: WorkflowRunStatus.failed })
      return
    }

    await this.workflowRunService.wakeUpWorkflowRun(workflowRun)
    const nextActionInputs = {
      ...(workflowSleep.nextActionInputs ?? {}),
      [workflowAction.id]: {
        ...((workflowSleep.nextActionInputs?.[workflowAction.id] as any) ?? {}),
        responseId: outputs.id,
        responseContent: outputs.content,
      },
    } as Record<string, Record<string, unknown>>
    const actions = await this.workflowActionService.findByIds(
      workflowAction.nextActions.map((next) => next.action) as Types.ObjectId[],
    )
    const promises = actions.map((action) =>
      this.runnerService.runWorkflowActionsTree(workflow, action, nextActionInputs, workflowRun, workflowSleep.itemId),
    )
    void Promise.all(promises).then(() => {
      return this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
    })
  }
}
