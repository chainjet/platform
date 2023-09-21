import { XmtpMessageOutput } from '@app/definitions/integration-definitions/xmtp/xmtp.common'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { ContactService } from '../../chat/services/contact.service'
import { IntegrationTrigger } from '../../integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { Integration } from '../../integrations/entities/integration'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunStatus } from '../../workflow-runs/entities/workflow-run-status'
import { WorkflowSleep } from '../../workflow-runs/entities/workflow-sleep'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowSleepService } from '../../workflow-runs/services/workflow-sleep.service'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { WorkflowTrigger } from '../entities/workflow-trigger'
import { WorkflowTriggerService } from './workflow-trigger.service'
import { WorkflowUsedIdService } from './workflow-used-id.service'

interface XmtpMessage {
  user: string
  triggers: {
    chatbot: string[]
    xmtp: string[]
    xmtpMessageSent: string[]
  }
  message: XmtpMessageOutput & { env: string }
}

@Processor('chatbotMessage')
export class ChatbotConsumer {
  private readonly logger = new Logger(ChatbotConsumer.name)

  private chatbotIntegration: Integration
  private chatbotIntegrationTrigger: IntegrationTrigger
  private xmtpIntegration: Integration
  private xmtpNewMessageIntegrationTrigger: IntegrationTrigger
  private xmtpMessageSentIntegrationTrigger: IntegrationTrigger

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly runnerService: RunnerService,
    private workflowUsedIdService: WorkflowUsedIdService,
    private workflowSleepService: WorkflowSleepService,
    private contactService: ContactService,
  ) {}

  async onModuleInit() {
    this.chatbotIntegration = (await this.integrationService.findOne({ key: 'chatbot' })) as Integration
    this.chatbotIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.chatbotIntegration._id,
      key: 'newChatbotMessage',
    })) as IntegrationTrigger

    this.xmtpIntegration = (await this.integrationService.findOne({ key: 'xmtp' })) as Integration
    this.xmtpNewMessageIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.xmtpIntegration._id,
      key: 'newMessage',
    })) as IntegrationTrigger
    this.xmtpMessageSentIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.xmtpIntegration._id,
      key: 'newMessageSent',
    })) as IntegrationTrigger
  }

  @Process()
  async onMessageRecieved(job: Job<XmtpMessage>) {
    const data = job.data

    if (data.triggers.chatbot.length) {
      let chatbotWorkflowTriggers = await this.workflowTriggerService.find({
        _id: { $in: data.triggers.chatbot.map((trigger: string) => new ObjectId(trigger)) },
      })
      chatbotWorkflowTriggers = chatbotWorkflowTriggers.filter((trigger) => {
        if (trigger.owner.toString() !== data.user) {
          return false
        }
        if (trigger.integrationTrigger.toString() !== this.chatbotIntegrationTrigger._id.toString()) {
          return false
        }
        if (trigger.planLimited) {
          return false
        }
        if (data.message.env.split(':')[1] === 'production') {
          if (!trigger.enabled) {
            return false
          }
        } else {
          if (!trigger.inputs?.testEnabled) {
            return false
          }
        }
        return true
      })
      const chatbotPromises = chatbotWorkflowTriggers.map(async (workflowTrigger) =>
        this.processChatbotMessage(data.message, workflowTrigger),
      )
      await Promise.all(chatbotPromises)
    }

    if (data.triggers.xmtp.length || data.triggers.xmtpMessageSent.length) {
      let triggerIds = data.triggers.xmtp.concat(data.triggers.xmtpMessageSent)
      let xmtpWorkflowTriggers = await this.workflowTriggerService.find({
        _id: { $in: triggerIds.map((trigger: string) => new ObjectId(trigger)) },
      })
      xmtpWorkflowTriggers = xmtpWorkflowTriggers.filter((trigger) => {
        if (trigger.owner.toString() !== data.user) {
          return false
        }
        if (
          trigger.integrationTrigger.toString() !== this.xmtpNewMessageIntegrationTrigger._id.toString() &&
          trigger.integrationTrigger.toString() !== this.xmtpMessageSentIntegrationTrigger._id.toString()
        ) {
          return false
        }
        if (!trigger.enabled || trigger.planLimited) {
          return false
        }
        return true
      })

      const xmtpPromises = xmtpWorkflowTriggers.map(async (workflowTrigger) =>
        this.processXmtpMessage(data.message, workflowTrigger),
      )
      await Promise.all(xmtpPromises)
    }
  }

  async processChatbotMessage(message: XmtpMessageOutput, workflowTrigger: WorkflowTrigger) {
    try {
      await this.workflowUsedIdService.createOne({
        workflow: workflowTrigger.workflow,
        triggerId: message.id,
      })
    } catch (e) {
      this.logger.log(`Message ${message.id} already processed`)
      return
    }

    const workflow = await this.workflowService.findOne({ _id: workflowTrigger.workflow })
    if (!workflow) {
      return
    }

    this.logger.log(`Processing chatbot message: ${message.id} for workflow: ${workflow._id}`)

    const workflowSleeps = await this.workflowSleepService.find({
      workflow: workflowTrigger.workflow,
      uniqueGroup: message.conversation.id,
    })

    // continue previous conversation
    if (workflowSleeps.length > 0) {
      void this.continueConversation(workflow, workflowTrigger, workflowSleeps, message)
      return
    }

    // filter by allowed keywords
    if (workflowTrigger.inputs?.keywords?.trim()) {
      const keywords = workflowTrigger.inputs.keywords.split(',').map((keyword: string) => keyword.trim().toLowerCase())
      if (!keywords.some((keyword: string) => message.content.toLowerCase().includes(keyword))) {
        return
      }
    }

    if (workflowTrigger.inputs?.activateOncePerContact) {
      try {
        await this.workflowUsedIdService.createOne({
          workflow: workflowTrigger._id,
          triggerId: message.senderAddress,
        })
      } catch {
        this.logger.log(`Contact ${message.senderAddress} already processed for workflow ${workflowTrigger.workflow}`)
        return
      }
    }

    // add tags to the contact
    const tags: string[] = workflowTrigger.inputs?.tags?.split(',').map((tag: string) => tag.trim()) ?? []
    await this.contactService.addTags(message.senderAddress, tags, workflow.owner._id)

    const hookTriggerOutputs = {
      id: message.id,
      outputs: {
        [workflowTrigger.id]: message as Record<string, any>,
        trigger: message as Record<string, any>,
        contact: {
          address: message.senderAddress,
        },
        message: {
          id: message.id,
          content: message.content,
        },
        messages: [{ content: message.content, from: 'user' }],
      },
    }
    const rootActions = await this.workflowActionService.find({ workflow: workflow._id, isRootAction: true })
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      this.chatbotIntegration,
      this.chatbotIntegrationTrigger,
      workflow,
      workflowTrigger,
      rootActions.length > 0,
    )
    await this.workflowTriggerService.updateById(workflowTrigger._id, {
      lastId: message.id,
      lastItem: message,
    })
    void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
  }

  async continueConversation(
    workflow: Workflow,
    workflowTrigger: WorkflowTrigger,
    workflowSleeps: WorkflowSleep[],
    message: XmtpMessageOutput,
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
        responseId: message.id,
        responseContent: message.content,
      },
      // message output should always contain the latest message
      message: {
        id: message.id,
        content: message.content,
      },
      messages: [
        ...((workflowSleep.nextActionInputs as any)?.messages ?? []),
        { content: message.content, from: 'user' },
      ],
    } as Record<string, Record<string, unknown>>

    if (workflowSleep.repeat) {
      await this.runnerService.runWorkflowActionsTree(
        workflow,
        workflowAction,
        nextActionInputs,
        workflowRun,
        workflowSleep.itemId,
      )
      return this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
    }

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

  async processXmtpMessage(message: XmtpMessageOutput, workflowTrigger: WorkflowTrigger) {
    try {
      await this.workflowUsedIdService.createOne({
        workflow: workflowTrigger.workflow,
        triggerId: message.id,
      })
    } catch (e) {
      this.logger.log(`Message ${message.id} already processed`)
      return
    }

    const workflow = await this.workflowService.findOne({ _id: workflowTrigger.workflow })
    if (!workflow) {
      return
    }

    this.logger.log(`Processing xmtp message: ${message.id} for workflow: ${workflow._id}`)

    const hookTriggerOutputs = {
      id: message.id,
      outputs: {
        [workflowTrigger.id]: message as Record<string, any>,
        trigger: message as Record<string, any>,
      },
    }

    const rootActions = await this.workflowActionService.find({ workflow: workflow._id, isRootAction: true })
    const integrationTrigger =
      workflowTrigger.integrationTrigger.toString() === this.xmtpNewMessageIntegrationTrigger._id.toString()
        ? this.xmtpNewMessageIntegrationTrigger
        : this.xmtpMessageSentIntegrationTrigger
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      this.xmtpIntegration,
      integrationTrigger,
      workflow,
      workflowTrigger,
      rootActions.length > 0,
    )
    await this.workflowTriggerService.updateById(workflowTrigger._id, {
      lastId: message.id,
      lastItem: message,
    })
    void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
  }
}
