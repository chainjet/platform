import { generateSchemaFromObject } from '@app/definitions/schema/utils/jsonSchemaUtils'
import { All, Controller, Logger, Param, Req } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception'
import { Request } from 'express'
import { isEmptyObj } from '../../../../../libs/common/src/utils/object.utils'
import { IntegrationDefinitionFactory } from '../../../../../libs/definitions/src'
import { RunnerService } from '../../../../runner/src/services/runner.service'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { IntegrationAccount } from '../../integration-accounts/entities/integration-account'
import { IntegrationAccountService } from '../../integration-accounts/services/integration-account.service'
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
    private readonly integrationAccountService: IntegrationAccountService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly accountCredentialService: AccountCredentialService,
    private readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
    private readonly runnerService: RunnerService,
  ) {}

  @All('/integration/:integrationKey')
  async receiveIntegrationHook(@Param('integrationKey') integrationKey: string, @Req() req: Request) {
    const integration = await this.integrationService.findOne({ key: integrationKey })
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationKey} not found`)
    }
    this.logger.log(`Received webhook for integration ${integrationKey}`)

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const { response, runs } = await definition.onHookReceived(req, {
      integrationTriggerService: this.integrationTriggerService,
      workflowTriggerService: this.workflowTriggerService,
    })

    for (const run of runs) {
      const workflow = await this.workflowService.findById(run.workflowTrigger.workflow.toString())
      if (!workflow) {
        this.logger.error(
          `Workflow ${run.workflowTrigger.workflow} not found when resolving hook for ${integrationKey}`,
        )
        continue
      }
      this.logger.log(`Running workflow ${workflow.id} triggered by hook on ${integrationKey}`)

      const hookOutputs = {
        trigger: run.outputs,
        [run.workflowTrigger.id]: run.outputs,
      }

      const rootActions = await this.workflowActionService.find({ workflow: workflow.id, isRootAction: true })
      const workflowRun = await this.workflowRunService.createOneByInstantTrigger(
        integration,
        run.integrationTrigger,
        workflow,
        run.workflowTrigger,
        rootActions.length > 0,
      )
      await this.workflowTriggerService.updateById(run.workflowTrigger._id, {
        lastItem: run.outputs,
      })
      void this.runnerService.runWorkflowActions(rootActions, [hookOutputs], workflowRun)
    }

    return response
  }

  @All(':hookId')
  async receiveHook(@Param('hookId') hookId: string, @Req() req: Request): Promise<any> {
    if (req.method === 'HEAD') {
      return {}
    }

    hookId = hookId?.trim() ?? ''
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
        const raw = (req as any).rawBody // await rawbody(req)
        req.body = JSON.parse(raw.toString().trim())
      } catch {}
    }

    let accountCredential: AccountCredential | null = null
    let integrationAccount: IntegrationAccount | null = null
    if (workflowTrigger.credentials) {
      accountCredential =
        (await this.accountCredentialService.findById(workflowTrigger.credentials._id.toString())) ?? null
      if (accountCredential) {
        integrationAccount =
          (await this.integrationAccountService.findById(accountCredential.integrationAccount._id.toString())) ?? null
      }
    }

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const { canContinue, response } = await definition.onHookReceivedForWorkflowTrigger(req, {
      workflowOperation: workflowTrigger,
      operation: integrationTrigger,
      integration: integration,
      inputs: {},
      integrationAccount,
      accountCredential,
      credentials: accountCredential?.credentials ?? {},
    })

    if (!canContinue) {
      return {}
    }

    const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
    if (!workflow) {
      this.logger.log(`${hookId} - Workflow not found`)
      throw new NotFoundException(`Workflow ${workflowTrigger.workflow} not found`)
    }

    this.logger.log(`${hookId} - Running workflow ${workflow.id}`)

    let triggerOutputs: Record<string, unknown> = response?.outputs ?? {}

    if (integrationTrigger.learnResponseWorkflow && !workflowTrigger.schemaResponse && !isEmptyObj(triggerOutputs)) {
      const schemaResponse = generateSchemaFromObject(triggerOutputs)
      if (schemaResponse) {
        workflowTrigger.schemaResponse = schemaResponse
        await this.workflowTriggerService.updateOne(workflowTrigger.id, {
          schemaResponse: workflowTrigger.schemaResponse,
        })
      }
    }

    if (integrationTrigger.learnResponseWorkflow) {
      triggerOutputs = await definition.getDynamicSchemaOutputs(req)
    }

    const hookOutputs = {
      trigger: triggerOutputs,
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
    await this.workflowTriggerService.updateById(workflowTrigger._id, {
      lastItem: triggerOutputs,
    })
    void this.runnerService.runWorkflowActions(rootActions, [hookOutputs], workflowRun)

    return {
      message: 'Hook successfuly received',
      workflowRunId: workflowRun.id,
    }
  }
}
