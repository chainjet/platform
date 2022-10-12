import { isEmptyObj } from '@app/common/utils/object.utils'
import { Definition, IntegrationDefinitionFactory, RunResponse } from '@app/definitions'
import { generateSchemaFromObject } from '@app/definitions/schema/utils/jsonSchemaUtils'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { UserService } from 'apps/api/src/users/services/user.service'
import { WorkflowUsedIdService } from 'apps/api/src/workflow-triggers/services/workflow-used-id.service'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { Reference } from '../../../../libs/common/src/typings/mongodb'
import { AccountCredential } from '../../../api/src/account-credentials/entities/account-credential'
import { AccountCredentialService } from '../../../api/src/account-credentials/services/account-credentials.service'
import { IntegrationAccount } from '../../../api/src/integration-accounts/entities/integration-account'
import { IntegrationAccountService } from '../../../api/src/integration-accounts/services/integration-account.service'
import { IntegrationActionService } from '../../../api/src/integration-actions/services/integration-action.service'
import { IntegrationTrigger } from '../../../api/src/integration-triggers/entities/integration-trigger'
import { IntegrationTriggerService } from '../../../api/src/integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../../api/src/integrations/services/integration.service'
import { WorkflowAction } from '../../../api/src/workflow-actions/entities/workflow-action'
import { WorkflowActionService } from '../../../api/src/workflow-actions/services/workflow-action.service'
import { WorkflowRun } from '../../../api/src/workflow-runs/entities/workflow-run'
import { WorkflowRunAction } from '../../../api/src/workflow-runs/entities/workflow-run-action'
import { WorkflowRunStartedByOptions } from '../../../api/src/workflow-runs/entities/workflow-run-started-by-options'
import { WorkflowRunStatus } from '../../../api/src/workflow-runs/entities/workflow-run-status'
import { WorkflowSleep } from '../../../api/src/workflow-runs/entities/workflow-sleep'
import { WorkflowRunService } from '../../../api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTrigger } from '../../../api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../../api/src/workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../../../api/src/workflows/entities/workflow'
import { WorkflowService } from '../../../api/src/workflows/services/workflow.service'
import { parseStepInputs } from '../utils/input.utils'
import { extractTriggerItems } from '../utils/trigger.utils'
import { OperationRunnerService, OperationRunOptions } from './operation-runner.service'

@Injectable()
export class RunnerService {
  private readonly logger = new Logger(RunnerService.name)

  constructor(
    private readonly operationRunnerService: OperationRunnerService,
    private readonly userService: UserService,
    private readonly integrationService: IntegrationService,
    private readonly integrationAccountService: IntegrationAccountService,
    private readonly integrationActionService: IntegrationActionService,
    private readonly integrationTriggerService: IntegrationTriggerService,
    private readonly workflowService: WorkflowService,
    private readonly workflowActionService: WorkflowActionService,
    private readonly workflowTriggerService: WorkflowTriggerService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly workflowUsedIdService: WorkflowUsedIdService,
    private readonly accountCredentialService: AccountCredentialService,
    private readonly integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {}

  async runWorkflowTriggerCheck(
    workflowTrigger: WorkflowTrigger,
    startedBy: WorkflowRunStartedByOptions,
    opts?: { ignoreUsedId?: boolean },
  ): Promise<void> {
    this.logger.debug(`Checking for trigger ${workflowTrigger.id}`)

    const userId = new ObjectId(workflowTrigger.owner.toString())

    // Make sure the workflow has a first action, otherwise don't run it
    const rootActions = await this.workflowActionService.find({
      workflow: workflowTrigger.workflow,
      isRootAction: true,
    })
    if (!rootActions.length) {
      this.logger.debug(`Trigger ${workflowTrigger.id} doesn't have first action`)
      return
    }

    const integrationTrigger = await this.integrationTriggerService.findById(
      workflowTrigger.integrationTrigger.toString(),
    )
    if (!integrationTrigger) {
      // TODO this should be reported as a ServerError
      throw new NotFoundException(`IntegrationTrigger ${workflowTrigger.integrationTrigger} not found`)
    }

    if (!integrationTrigger.idKey) {
      // TODO this should be reported as a ServerError
      throw new Error(`Tried to run an integration trigger without idKey (id: ${integrationTrigger.id})`)
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      // TODO this should be reported as a ServerError
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found`)
    }

    const workflowRun = await this.workflowRunService.createOne({
      owner: workflowTrigger.owner,
      workflow: workflowTrigger.workflow,
      status: WorkflowRunStatus.running,
      startedBy,
      triggerRun: {
        integrationName: integration.name,
        operationName: integrationTrigger.name,
        workflowTrigger: workflowTrigger._id,
        status: WorkflowRunStatus.running,
      },
    })

    const { credentials, accountCredential, integrationAccount } = await this.getCredentialsAndIntegrationAccount(
      workflowTrigger.credentials?.toString(),
      workflowTrigger.owner.toString(),
      () => this.onTriggerFailure(workflowTrigger.workflow, userId, workflowRun, 'Credentials not found'),
    )

    let inputs: Record<string, unknown>
    try {
      inputs = parseStepInputs({ ...workflowTrigger.inputs }, {})
    } catch (e) {
      await this.onTriggerFailure(workflowTrigger.workflow, userId, workflowRun, `Invalid inputs (${e.message})`)
      this.logger.error(`Parse step inputs for ${workflowTrigger.id} failed with error ${e.message}`)
      return
    }

    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    let runResponse: RunResponse
    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    try {
      runResponse = await this.operationRunnerService.runTriggerCheck(definition, {
        integration,
        integrationAccount,
        operation: integrationTrigger,
        inputs,
        credentials,
        accountCredential,
        workflowOperation: workflowTrigger,
        user: {
          id: userId.toString(),
          address: user.address,
          email: user.email,
        },
      })
    } catch (e) {
      let error = definition.parseError(e)
      if (!error || error.toString() === '[object Object]') {
        error = e.message
      }
      await this.onTriggerFailure(
        workflowTrigger.workflow,
        userId,
        workflowRun,
        error?.toString(),
        e.response?.text || undefined,
      )
      this.logger.error(`Run WorkflowTrigger ${workflowTrigger.id} failed with error ${error}`)
      return
    }

    const triggerItems = extractTriggerItems(integrationTrigger.idKey, runResponse.outputs)
    const triggerIds = triggerItems.map((item) => item.id.toString())

    let newItems: Array<{ id: string | number; item: Record<string, unknown> }> = []
    if (!opts?.ignoreUsedId) {
      const usedIds = await this.workflowUsedIdService.find({
        workflow: workflowTrigger.workflow,
        triggerId: { $in: triggerIds },
      })

      newItems = triggerItems.filter(
        (item) => !usedIds.find((usedId) => usedId.triggerId.toString() === item.id.toString()),
      )
    } else {
      newItems = triggerItems.slice(0, 1)
    }

    if (newItems.length === 0) {
      this.logger.debug(`Trigger condition not satisfied for trigger ${workflowTrigger.id}`)
      await this.workflowRunService.markTriggerAsCompleted(userId, workflowRun._id, false, triggerIds.slice(0, 1))
      return
    }

    this.logger.log(`Trigger condition satisfied for trigger ${workflowTrigger.id}`)

    // Populate triggered items if x-triggerPopulate is set
    if (integrationTrigger.triggerPopulate?.operationId) {
      for (const newItem of newItems) {
        const populatedOutputs = await this.populateTrigger(definition, newItem.item, {
          integration,
          integrationAccount,
          operation: integrationTrigger,
          inputs,
          credentials,
          accountCredential,
          workflowOperation: workflowTrigger,
          user: {
            id: userId.toString(),
            address: user.address,
            email: user.email,
          },
        })
        newItem.item = {
          ...populatedOutputs,
          ...newItem.item,
        }
      }
    }

    const createdItems: Array<{ id: string | number; item: Record<string, unknown> }> = []
    for (const newItem of newItems) {
      try {
        await this.workflowUsedIdService.createOne({
          workflow: workflowTrigger.workflow,
          triggerId: newItem.id.toString(),
        })
        createdItems.push(newItem)
      } catch (e) {}
    }

    await this.workflowRunService.markTriggerAsCompleted(
      userId,
      workflowRun._id,
      true,
      createdItems.map((item) => item.id.toString()),
    )

    if (runResponse.store !== workflowTrigger.store) {
      await this.workflowTriggerService.updateOne(workflowTrigger.id, { store: runResponse.store })
    }

    const triggerOutputsList = createdItems
      .reverse()
      .map((data) => ({ [workflowTrigger.id]: data.item, trigger: data.item }))
    await this.runWorkflowActions(rootActions, triggerOutputsList, workflowRun)
  }

  async startWorkflowRun(
    workflowId: ObjectId,
    triggerOutputs: Record<string, Record<string, unknown>>,
    workflowRun: WorkflowRun,
  ): Promise<void> {
    const rootActions = await this.workflowActionService.find({ workflow: workflowId, isRootAction: true })
    await this.runWorkflowActions(rootActions, [triggerOutputs], workflowRun)
  }

  async runWorkflowActions(
    rootActions: WorkflowAction[],
    triggerOutputsList: Array<Record<string, Record<string, unknown>>>,
    workflowRun: WorkflowRun,
  ): Promise<void> {
    for (const triggerOutputs of triggerOutputsList) {
      const promises = rootActions.map((action) => this.runWorkflowActionsTree(action, triggerOutputs, workflowRun))
      await Promise.all(promises)
    }
    await this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
  }

  async runWorkflowActionsTree(
    workflowAction: WorkflowAction,
    previousOutputs: Record<string, Record<string, unknown>>,
    workflowRun: WorkflowRun,
  ): Promise<void> {
    this.logger.log(`Running workflow action ${workflowAction.id} for workflow ${workflowAction.workflow}`)

    const userId = new ObjectId(workflowAction.owner.toString())

    const integrationAction = await this.integrationActionService.findById(workflowAction.integrationAction.toString())
    if (!integrationAction) {
      // TODO this should be reported as a ServerError
      throw new NotFoundException(`IntegrationAction ${workflowAction.integrationAction} not found`)
    }
    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      // TODO this should be reported as a ServerError
      throw new NotFoundException(`Integration ${integrationAction.integration} not found`)
    }

    const workflowRunAction = await this.workflowRunService.addRunningAction(
      workflowRun._id,
      workflowAction._id,
      integration.name,
      integrationAction.name,
    )

    const { credentials, accountCredential, integrationAccount } = await this.getCredentialsAndIntegrationAccount(
      workflowAction.credentials?.toString(),
      workflowAction.owner.toString(),
      () =>
        this.onActionFailure(workflowAction.workflow, userId, workflowRun, workflowRunAction, 'Credentials not found'),
    )

    let inputs: Record<string, unknown>
    try {
      inputs = parseStepInputs({ ...workflowAction.inputs }, previousOutputs)
    } catch (e) {
      await this.onActionFailure(
        workflowAction.workflow,
        userId,
        workflowRun,
        workflowRunAction,
        `Invalid inputs (${e.message})`,
      )
      this.logger.error(`Parse step inputs for ${workflowAction.id} failed with error ${e.message}`)
      return
    }

    const user = await this.userService.findById(userId.toString())
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`)
    }

    let runResponse: RunResponse
    try {
      const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
      runResponse = await this.operationRunnerService.runAction(definition, {
        integration,
        integrationAccount,
        operation: integrationAction,
        inputs,
        credentials,
        accountCredential,
        workflowOperation: workflowAction,
        user: {
          id: userId.toString(),
          address: user.address,
          email: user.email,
        },
      })
      await this.workflowRunService.markActionAsCompleted(userId, workflowRun._id, workflowRunAction)
    } catch (e) {
      const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
      let error = definition.parseError(e)
      if (!error || error.toString() === '[object Object]') {
        error = e.message
      }
      await this.onActionFailure(
        workflowAction.workflow,
        userId,
        workflowRun,
        workflowRunAction,
        error?.toString(),
        e.response?.text || undefined,
      )
      this.logger.error(`Run WorkflowAction ${workflowAction.id} failed with error ${error}`)
      return
    }

    // learn schema response at integration or workflow level
    if (!isEmptyObj(runResponse?.outputs ?? {})) {
      if (integrationAction.learnResponseIntegration && !integrationAction.schemaResponse) {
        integrationAction.schemaResponse = generateSchemaFromObject(runResponse.outputs)
        await this.integrationActionService.updateOne(integrationAction.id, {
          schemaResponse: integrationAction.schemaResponse,
        })
      }
      if (integrationAction.learnResponseWorkflow && !workflowAction.schemaResponse) {
        workflowAction.schemaResponse = generateSchemaFromObject(runResponse.outputs)
        await this.workflowActionService.updateOne(workflowAction.id, {
          schemaResponse: workflowAction.schemaResponse,
        })
      }
    }

    const nextActionInputs = {
      ...previousOutputs,
      [workflowAction.id]: runResponse.outputs,
    }

    if (runResponse.sleepUntil) {
      await this.workflowRunService.sleepWorkflowRun(
        workflowRun,
        workflowAction,
        nextActionInputs,
        runResponse.sleepUntil,
      )
      return
    }

    // Filter out actions with conditions not met
    const nextActions = (workflowAction.nextActions ?? []).filter((nextAction) => {
      if (!nextAction.condition) {
        return true
      }
      return nextAction.condition === `${runResponse.condition}`
    })

    for (const workflowNextAction of nextActions) {
      const nextAction = await this.workflowActionService.findById(workflowNextAction.action.toString())
      if (!nextAction) {
        throw new Error(`WorkflowAction ${workflowNextAction.action} not found`)
      }
      await this.runWorkflowActionsTree(nextAction, nextActionInputs, workflowRun)
    }
  }

  async getCredentialsAndIntegrationAccount(
    credentialsId: string | undefined,
    ownerId: string,
    onError: () => any,
  ): Promise<{
    credentials: Record<string, string>
    accountCredential: AccountCredential | null
    integrationAccount: IntegrationAccount | null
  }> {
    let integrationAccount: IntegrationAccount | null = null
    let accountCredential: AccountCredential | null = null
    let credentials = {}
    if (credentialsId) {
      accountCredential = (await this.accountCredentialService.findById(credentialsId)) ?? null
      if (!accountCredential || accountCredential.owner.toString() !== ownerId) {
        await onError()
        return {
          credentials: {},
          accountCredential: null,
          integrationAccount,
        }
      }

      credentials = accountCredential.credentials ?? {}

      if (accountCredential.integrationAccount) {
        integrationAccount =
          (await this.integrationAccountService.findById(accountCredential.integrationAccount.toString())) ?? null
      }
    }
    return { credentials, accountCredential, integrationAccount }
  }

  /**
   * Support x-triggerPopulate OpenAPI extension - Get outputs form populate operation
   */
  async populateTrigger(
    definition: Definition,
    outputs: Record<string, unknown>,
    opts: OperationRunOptions,
  ): Promise<Record<string, unknown>> {
    const triggerPopulate = (opts.operation as IntegrationTrigger).triggerPopulate
    const integrationAction = await this.integrationActionService.findOne({ key: triggerPopulate?.operationId })
    if (triggerPopulate && integrationAction) {
      const parsedInputs = parseStepInputs(triggerPopulate.inputs, {
        inputs: opts.inputs,
        outputs,
      })
      const populateOutputs = await this.operationRunnerService.runAction(definition, {
        ...opts,
        inputs: parsedInputs,
        operation: integrationAction,
      })
      return populateOutputs.outputs
    }
    return {}
  }

  async wakeUpWorkflowRun(workflowSleep: WorkflowSleep): Promise<void> {
    const workflowRun = await this.workflowRunService.findById(workflowSleep.workflowRun.toString())
    const workflowAction = await this.workflowActionService.findById(workflowSleep.workflowAction.toString())
    if (workflowRun && workflowAction) {
      await this.workflowRunService.wakeUpWorkflowRun(workflowRun)
      const nextActionInputs = (workflowSleep.nextActionInputs ?? {}) as Record<string, Record<string, unknown>>
      const actions = await this.workflowActionService.findByIds(
        workflowAction.nextActions.map((next) => next.action) as mongoose.Types.ObjectId[],
      )
      const promises = actions.map((action) => this.runWorkflowActionsTree(action, nextActionInputs, workflowRun))
      await Promise.all(promises)
      await this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
    }
  }

  private async onTriggerFailure(
    workflowId: ObjectId | Reference<Workflow, mongoose.Types.ObjectId>,
    userId: ObjectId,
    workflowRun: WorkflowRun,
    errorMessage: string | undefined,
    errorResponse?: string,
  ): Promise<void> {
    await this.workflowRunService.markTriggerAsFailed(userId, workflowRun, errorMessage, errorResponse)
    await this.runWorkflowOnFailure(workflowId)
  }

  private async onActionFailure(
    workflowId: ObjectId | Reference<Workflow, mongoose.Types.ObjectId>,
    userId: ObjectId,
    workflowRun: WorkflowRun,
    workflowAction: WorkflowRunAction,
    errorMessage: string | undefined,
    errorResponse?: string,
  ): Promise<void> {
    await this.workflowRunService.markActionAsFailed(userId, workflowRun, workflowAction, errorMessage, errorResponse)
    await this.runWorkflowOnFailure(workflowId)
  }

  private async runWorkflowOnFailure(
    workflowId: ObjectId | Reference<Workflow, mongoose.Types.ObjectId>,
  ): Promise<void> {
    const workflow = await this.workflowService.findById(workflowId.toString())
    if (workflow?.runOnFailure) {
      const workflowRun = await this.workflowRunService.createOne({
        owner: workflow.owner,
        workflow: workflow.runOnFailure,
        status: WorkflowRunStatus.running,
        startedBy: WorkflowRunStartedByOptions.workflowFailure,
      })
      await this.startWorkflowRun(new ObjectId(workflow.runOnFailure.toString()), {}, workflowRun)
    }
  }
}
