import { XmtpMessageOutput } from '@app/definitions/integration-definitions/xmtp/xmtp.common'
import { BadRequestException, Body, Controller, Logger, Post, Req, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { uniq } from 'lodash'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { ContactService } from '../../contacts/services/contact.service'
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
import { WorkflowTriggerService } from '../services/workflow-trigger.service'
import { WorkflowUsedIdService } from '../services/workflow-used-id.service'

@Controller('/chatbots')
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name)

  private chatbotIntegration: Integration
  private chatbotIntegrationTrigger: IntegrationTrigger
  private xmtpIntegration: Integration
  private xmtpIntegrationTrigger: IntegrationTrigger

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
    this.xmtpIntegrationTrigger = (await this.integrationTriggerService.findOne({
      integration: this.xmtpIntegration._id,
      key: 'newMessage',
    })) as IntegrationTrigger
  }

  @Post('/')
  async received(@Body() body: Record<string, any>, @Req() req: Request) {
    if (req.headers?.authorization !== process.env.CHATBOT_SECRET) {
      throw new UnauthorizedException()
    }
    if (!body.user || !body.message) {
      throw new BadRequestException()
    }

    if (body.triggers.chatbot.length) {
      let chatbotWorkflowTriggers = await this.workflowTriggerService.find({
        _id: { $in: body.triggers.chatbot.map((trigger: string) => new ObjectId(trigger)) },
      })
      chatbotWorkflowTriggers = chatbotWorkflowTriggers.filter((trigger) => {
        if (trigger.owner.toString() !== body.user) {
          return false
        }
        if (trigger.integrationTrigger.toString() !== this.chatbotIntegrationTrigger._id.toString()) {
          return false
        }
        if (trigger.planLimited) {
          return false
        }
        if (body.message.env.split(':')[1] === 'production') {
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
        this.processChatbotMessage(body.message, workflowTrigger),
      )
      await Promise.all(chatbotPromises)
    }

    if (body.triggers.xmtp.length) {
      let xmtpWorkflowTriggers = await this.workflowTriggerService.find({
        _id: { $in: body.triggers.xmtp.map((trigger: string) => new ObjectId(trigger)) },
      })
      xmtpWorkflowTriggers = xmtpWorkflowTriggers.filter((trigger) => {
        if (trigger.owner.toString() !== body.user) {
          return false
        }
        if (trigger.integrationTrigger.toString() !== this.xmtpIntegrationTrigger._id.toString()) {
          return false
        }
        if (!trigger.enabled || trigger.planLimited) {
          return false
        }
        return true
      })

      const xmtpPromises = xmtpWorkflowTriggers.map(async (workflowTrigger) =>
        this.processXmtpMessage(body.message, workflowTrigger),
      )
      await Promise.all(xmtpPromises)
    }

    return { ok: true }
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

    // filter keywords on activateForKeywords
    if (workflowTrigger.inputs?.activateForKeywords) {
      const keywords = workflowTrigger.inputs.keywords.split(',').map((keyword: string) => keyword.trim().toLowerCase())
      if (!keywords.some((keyword: string) => message.content.toLowerCase().includes(keyword))) {
        return
      }
    }

    // TODO apply activateForNewConversations

    const tags = workflowTrigger.inputs?.tags?.split(',').map((tag) => tag.trim()) ?? []
    const contact = await this.contactService.findOne({
      owner: workflow.owner,
      address: message.senderAddress,
    })
    if (!contact) {
      await this.contactService.createOne({
        owner: workflow.owner,
        address: message.senderAddress,
        tags,
      })
    } else if (workflowTrigger.inputs?.tags) {
      const newTags = uniq([...contact.tags, ...tags])
      if (newTags.length !== contact.tags.length) {
        await this.contactService.updateById(contact._id, {
          tags: contact.tags,
        })
      }
    }

    const hookTriggerOutputs = {
      id: message.id,
      outputs: {
        [workflowTrigger.id]: message as Record<string, any>,
        trigger: message as Record<string, any>,
        contact: {
          address: message.senderAddress,
        },
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
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      this.xmtpIntegration,
      this.xmtpIntegrationTrigger,
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
