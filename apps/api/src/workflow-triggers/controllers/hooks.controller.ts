import { All, Controller, Logger, Param, Req } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception'
import { Request } from 'express'
import rawbody from 'raw-body'
import { isEmptyObj } from '../../../../../libs/common/src/utils/object.utils'
import { IntegrationDefinitionFactory } from '../../../../../libs/definitions/src'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowRunService } from '../../workflow-runs/services/workflow-run.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { WorkflowTriggerService } from '../services/workflow-trigger.service'

@Controller('/hooks')
export class HooksController {
  private readonly logger = new Logger(HooksController.name)

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
    private readonly runnerService: RunnerService,
  ) {}

  @All(':hookId')
  async receiveHook(@Param('hookId') hookId: string, @Req() req: Request): Promise<any> {
    this.logger.log(`${hookId} - Received hook`)

    const workflowTrigger = await this.workflowTriggerService.findOne({ hookId })
    if (!workflowTrigger) {
      this.logger.log(`${hookId} - Workflow trigger not found`)
      throw new NotFoundException('Webhook not found')
    }
    const integrationTrigger = await this.integrationTriggerService.findById(
      workflowTrigger.integrationTrigger.toString(),
    )
    if (!integrationTrigger) {
      this.logger.error(`${hookId} - Integration trigger ${workflowTrigger.integrationTrigger} not found`)
      throw new NotFoundException(`Integration trigger ${workflowTrigger.integrationTrigger} not found`)
    }
    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      this.logger.error(`${hookId} - Integration ${integrationTrigger.integration} not found`)
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found`)
    }

    if (req.readable) {
      try {
        // body is ignored by NestJS -> get raw body from request
        const raw = await rawbody(req)
        req.body = JSON.parse(raw.toString().trim())
      } catch {}
    }

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const canContinue = await definition.onHookReceived(req, workflowTrigger)

    if (!canContinue) {
      return {}
    }

    const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
    if (!workflow) {
      this.logger.log(`${hookId} - Workflow not found`)
      throw new NotFoundException(`Workflow ${workflowTrigger.workflow} not found`)
    }

    this.logger.log(`${hookId} - Running workflow ${workflow.id}`)

    let triggerOutputs: Record<string, unknown> = {
      ...(req.query ?? {}),
      ...(req.body ?? {}),
    }

    if (integrationTrigger.dynamicSchemaResponse && !workflowTrigger.schemaResponse && !isEmptyObj(triggerOutputs)) {
      const schemaResponse = definition.getDynamicSchemaResponse(req)
      if (schemaResponse) {
        workflowTrigger.schemaResponse = schemaResponse
        await this.workflowTriggerService.updateOne(workflowTrigger.id, {
          schemaResponse: workflowTrigger.schemaResponse,
        })
      }
    }

    if (integrationTrigger.dynamicSchemaResponse) {
      triggerOutputs = await definition.getDynamicSchemaOutputs(req)
    }

    const hookOutputs = {
      [workflowTrigger.id]: triggerOutputs,
    }

    const rootActions = await this.workflowActionService.find({ workflow: workflow.id, isRootAction: true })
    const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
      integration,
      integrationTrigger,
      workflow,
      workflowTrigger,
      rootActions.length > 0,
    )
    void this.runnerService.runWorkflowActions(rootActions, [hookOutputs], workflowRun)

    return {
      message: 'Hook successfuly received',
      workflowRunId: workflowRun.id,
    }
  }
}
