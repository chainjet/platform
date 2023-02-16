import { getLensProfile } from '@app/definitions/integration-definitions/lens/lens.common'
import { BadRequestException, Controller, Logger, Post, Req, UnauthorizedException } from '@nestjs/common'
import { getAddress } from 'ethers/lib/utils'
import { Request } from 'express'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { UserService } from '../../users/services/user.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'

@Controller()
export class ChainJetBotController {
  private readonly logger = new Logger(ChainJetBotController.name)

  constructor(
    private readonly userService: UserService,
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly runnerService: RunnerService,
  ) {}

  @Post('/v1/chainjetbot')
  async processChainJetBotMention(@Req() req: Request) {
    this.logger.log(`Received webhook for ChainJetBot ${JSON.stringify(req.body)}`)
    const { headers, body } = req

    // validate bearer token
    if (!headers.authorization || headers.authorization !== process.env.CHAINJETBOT_WEBHOOK_KEY) {
      throw new UnauthorizedException('Invalid key')
    }

    if (!body.handle) {
      throw new BadRequestException('Handle is required')
    }

    const { ownedBy } = await getLensProfile(body.handle)

    const user = await this.userService.findOne({ address: getAddress(ownedBy) })
    if (!user) {
      // TODO reply with @ChainJetBot
      throw new BadRequestException('User not found')
    }

    const lensIntegration = await this.integrationService.findOne({ key: 'lens' })
    const botMentionIntegrationTrigger = await this.integrationTriggerService.findOne({
      integration: lensIntegration!.id,
      key: 'newMentionToChainJetBot',
    })
    const workflowTriggers = await this.workflowTriggerService.find({
      owner: user._id.toString(),
      integrationTrigger: botMentionIntegrationTrigger!.id,
      enabled: true,
    })

    const content = body.content.replace(/@ChainJetBot\.lens/i, '').trim()
    const matchingTriggers = workflowTriggers.filter(
      (trigger) => trigger.inputs?.startsWith && content.startsWith(trigger.inputs.startsWith),
    )

    if (!matchingTriggers.length) {
      // TODO reply with @ChainJetBot
      throw new BadRequestException('No matching triggers')
    }

    for (const trigger of matchingTriggers) {
      const outputs = {
        id: body.mentionId,
        mention: body.content
          .replace(new RegExp(`\\s*@ChainJetBot\\.lens\\s+${trigger.inputs!.startsWith}`, 'i'), '')
          .trim(),
        fullContent: body.content,
        mainPost: body.mainPost,
      }
      const hookTriggerOutputs = {
        id: body.mentionId,
        outputs: {
          trigger: outputs,
          [trigger.id]: outputs,
        },
      }

      const workflow = await this.workflowService.findOne({ _id: trigger.workflow._id.toString() })
      if (!workflow) {
        this.logger.error(`Workflow not found for trigger ${trigger.id}`)
        continue
      }

      const rootActions = await this.workflowActionService.find({
        workflow: workflow._id.toString(),
        isRootAction: true,
      })

      const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
        lensIntegration!,
        botMentionIntegrationTrigger!,
        workflow,
        trigger,
        rootActions.length > 0,
      )
      await this.workflowTriggerService.updateById(trigger._id, {
        lastItem: outputs,
      })
      void this.runnerService.runWorkflowActions(rootActions, [hookTriggerOutputs], workflowRun)
    }

    return {}
  }
}
