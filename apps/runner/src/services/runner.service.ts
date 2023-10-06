import { AuthenticationError } from '@app/common/errors/authentication-error'
import { wait } from '@app/common/utils/async.utils'
import { isEmptyObj } from '@app/common/utils/object.utils'
import { Definition, IntegrationDefinitionFactory, RunResponse } from '@app/definitions'
import { generateSchemaFromObject } from '@app/definitions/schema/utils/jsonSchemaUtils'
import { Injectable, Logger } from '@nestjs/common'
import { ContactService } from 'apps/api/src/chat/services/contact.service'
import { MenuService } from 'apps/api/src/chat/services/menu.service'
import { Integration } from 'apps/api/src/integrations/entities/integration'
import { User } from 'apps/api/src/users/entities/user'
import { UserService } from 'apps/api/src/users/services/user.service'
import { WorkflowUsedIdService } from 'apps/api/src/workflow-triggers/services/workflow-used-id.service'
import { ObjectId } from 'bson'
import _ from 'lodash'
import { Document } from 'mongodb'
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
import { TriggerItem, WorkflowRunService } from '../../../api/src/workflow-runs/services/workflow-run.service'
import { WorkflowTrigger } from '../../../api/src/workflow-triggers/entities/workflow-trigger'
import { WorkflowTriggerService } from '../../../api/src/workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../../../api/src/workflows/entities/workflow'
import { WorkflowService } from '../../../api/src/workflows/services/workflow.service'
import { OperationDailyLimitError } from '../errors/operation-daily-limit.error'
import { findOutputKeys, parseStepInputs } from '../utils/input.utils'
import { extractTriggerItems } from '../utils/trigger.utils'
import { OperationRunnerService, OperationRunOptions } from './operation-runner.service'

type TriggerItemId = string | number

interface TriggerOutputs {
  id: TriggerItemId
  outputs: Record<string, Record<string, unknown>>
}

@Injectable()
export class RunnerService {
  private readonly logger = new Logger(RunnerService.name)

  // true if we've received a SIGTERM
  private processInterrupted = false

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
    private readonly contactService: ContactService,
    private readonly menuService: MenuService,
  ) {}

  onModuleDestroy() {
    this.logger.log('Process interrupted, interrupting all runs')
    this.processInterrupted = true
  }

  async runWorkflowTriggerCheck(
    workflowTrigger: WorkflowTrigger,
    startedBy: WorkflowRunStartedByOptions,
    opts?: { testTrigger?: boolean; reRunItems?: 'last' | 'all' },
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
      this.logger.error(`IntegrationTrigger ${workflowTrigger.integrationTrigger} not found`)
      return
    }

    if (!integrationTrigger.idKey) {
      this.logger.error(`Tried to run an integration trigger without idKey (id: ${integrationTrigger.id})`)
      return
    }

    const integration = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integration) {
      this.logger.error(`Integration ${integrationTrigger.integration} not found`)
      return
    }

    const workflow = await this.workflowService.findById(workflowTrigger.workflow.toString())
    if (!workflow) {
      this.logger.error(`Workflow ${workflowTrigger.workflow} not found`)
      return
    }
    if (workflow.isTemplate) {
      if (workflowTrigger.enabled) {
        await this.workflowTriggerService.updateById(workflowTrigger._id, { enabled: false })
      }
      this.logger.error(`Workflow ${workflow.id} is a template and cannot be run`)
      return
    }

    // only create WorkflowRun if the workflow is triggered or if there is an error in the trigger
    const workflowRunData: Partial<WorkflowRun> = {
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
    }

    const { credentials, accountCredential, integrationAccount } = await this.getCredentialsAndIntegrationAccount(
      workflowTrigger.credentials?.toString(),
      workflowTrigger.owner.toString(),
      async () => {
        workflowTrigger.credentials?.toString(),
          await this.onTriggerFailure(workflow, workflowTrigger, workflowRunData, 'Credentials not found')
      },
    )

    let inputs: Record<string, unknown>
    try {
      inputs = parseStepInputs({ ...workflowTrigger.inputs }, {})
    } catch (e) {
      workflowTrigger.credentials?.toString(),
        await this.onTriggerFailure(workflow, workflowTrigger, workflowRunData, `Invalid inputs (${e.message})`)
      this.logger.error(
        `Parse step inputs for trigger ${workflowTrigger.id} for workflow ${workflow.id} failed with error ${e.message}`,
      )
      return
    }

    const user = await this.userService.findById(userId.toString())
    if (!user) {
      this.logger.error(`User ${userId} not found`)
      return
    }

    if (user.operationsUsedMonth >= user.planConfig.maxOperations && user.planConfig.hardLimits) {
      this.logger.log(`User ${user.id} has reached the monthly operation limit`)
      await this.workflowTriggerService.markUserPlanAsLimited(user._id)
      return
    }

    if (this.processInterrupted) {
      return
    }

    let runResponse: RunResponse
    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    try {
      runResponse = await this.operationRunnerService.runTriggerCheck(definition, {
        workflow,
        integration,
        integrationAccount,
        operation: integrationTrigger,
        inputs,
        credentials,
        accountCredential,
        workflowOperation: workflowTrigger,
        user,
        fetchAll: opts?.reRunItems === 'all',
      })
    } catch (e) {
      if (e instanceof AuthenticationError) {
        if (accountCredential) {
          await this.accountCredentialService.updateOne(accountCredential.id, { authExpired: true })
        }
      }
      let error = definition.parseError(e)
      if (!error || error.toString() === '[object Object]') {
        error = e.message
      }
      workflowTrigger.credentials?.toString(),
        await this.onTriggerFailure(
          workflow,
          workflowTrigger,
          workflowRunData,
          error?.toString(),
          e.response?.text || undefined,
          inputs,
        )
      this.logger.error(
        `Run WorkflowTrigger ${workflowTrigger.id} for workflow ${workflow.id} failed with error ${error}`,
      )
      return
    }

    // remove expired credentials
    if (accountCredential?.authExpired) {
      await this.accountCredentialService.updateOne(accountCredential.id, { authExpired: false })
    }

    // store refreshed credentials
    if (accountCredential && runResponse.refreshedCredentials) {
      this.accountCredentialService.updateOne(accountCredential.id, {
        credentialInputs: {
          ...accountCredential.credentials,
          ...runResponse.refreshedCredentials,
        },
      })
    }

    const triggerItems = extractTriggerItems(integrationTrigger.idKey, runResponse.outputs)
    const triggerIds = triggerItems.map((item) => item.id.toString())

    let newItems: Array<{ id: TriggerItemId; item: Record<string, unknown> }> = []

    if (workflowTrigger.lastId && !opts?.testTrigger && !opts?.reRunItems) {
      const lastItemIndex = triggerIds.indexOf(workflowTrigger.lastId?.toString())

      // filter out items older than lastId (only if we know the creation date of the items)
      if (lastItemIndex === -1 || !triggerItems?.[0].createdAt) {
        newItems = triggerItems
      } else {
        newItems = triggerItems.slice(0, lastItemIndex)
      }

      // filter out used ids
      const usedIds = await this.workflowUsedIdService.find({
        workflow: workflowTrigger.workflow,
        triggerId: { $in: newItems.map((item) => item.id.toString()) },
      })
      newItems = newItems.filter(
        (item) => !usedIds.find((usedId) => usedId.triggerId.toString() === item.id.toString()),
      )
    } else if (opts?.reRunItems === 'all') {
      newItems = triggerItems
    } else {
      newItems = triggerItems.slice(0, 1)
      // on the first (non test) run, store all the existing IDs so we don't use them (critical for items without createdAt)
      if (!workflowTrigger.lastId && !opts?.reRunItems) {
        for (const newItem of triggerItems.slice(1)) {
          try {
            await this.workflowUsedIdService.createOne({
              workflow: workflowTrigger.workflow,
              triggerId: newItem.id.toString(),
            })
          } catch (e) {}
        }
      }
    }

    if (workflowTrigger.maxItemsPerRun && newItems.length > workflowTrigger.maxItemsPerRun) {
      newItems = newItems.slice(0, workflowTrigger.maxItemsPerRun)
    }

    if (user.planConfig.maxTriggerItems) {
      newItems = newItems.slice(0, user.planConfig.maxTriggerItems)
    }

    // If there are no new items, update the trigger, increase operations used and return. There is no need to create a workflow run.
    if (newItems.length === 0) {
      this.logger.debug(`Trigger condition not satisfied for trigger ${workflowTrigger.id} on workflow ${workflow.id}`)
      await this.userService.incrementOperationsUsed(userId, true, runResponse.credits ?? 1)
      await this.workflowTriggerService.updateOneNative(
        { _id: workflowTrigger._id },
        {
          lastCheck: new Date(),
          consecutiveTriggerFails: 0,
          store: runResponse.store,
          ...(runResponse.nextCheck !== undefined
            ? { nextCheck: runResponse.nextCheck, enabled: !!runResponse.nextCheck }
            : {}),
        },
      )
      return
    }

    this.logger.log(
      `Trigger condition satisfied for trigger ${workflowTrigger.id} with ${newItems.length} items on workflow ${workflow.id}`,
    )

    // Populate triggered items if x-triggerPopulate is set
    if (integrationTrigger.triggerPopulate?.operationId) {
      for (const newItem of newItems) {
        const populatedOutputs = await this.populateTrigger(definition, newItem.item, {
          workflow,
          integration,
          integrationAccount,
          operation: integrationTrigger,
          inputs,
          credentials,
          accountCredential,
          workflowOperation: workflowTrigger,
          user,
        })
        newItem.item = {
          ...populatedOutputs,
          ...newItem.item,
        }
      }
    }

    const newUniqueItems: Array<{ id: TriggerItemId; item: Record<string, unknown> }> = []
    for (const newItem of newItems) {
      try {
        if (!opts?.reRunItems) {
          await this.workflowUsedIdService.createOne({
            workflow: workflowTrigger.workflow,
            triggerId: newItem.id.toString(),
          })
        }
        newUniqueItems.push(newItem)
      } catch (e) {}
    }

    const workflowRun = await this.workflowRunService.createCompletedTriggerRun(
      userId,
      workflowRunData,
      newUniqueItems.map((item) => item.id.toString()),
      newUniqueItems,
      runResponse.credits ?? 1,
    )

    // use update native to avoid running WorkflowTrigger.updateOne hooks
    await this.workflowTriggerService.updateOneNative(
      { _id: workflowTrigger._id },
      {
        lastId: triggerIds[0],
        lastItem: triggerItems[0]?.item ?? {},
        lastCheck: new Date(),
        consecutiveTriggerFails: 0,
        store: runResponse.store,
        ...(runResponse.nextCheck !== undefined
          ? { nextCheck: runResponse.nextCheck, enabled: !!runResponse.nextCheck }
          : {}),
      },
    )

    const triggerOutputsList = newUniqueItems
      .reverse()
      .map((data) => ({ id: data.id, outputs: { [workflowTrigger.id]: data.item, trigger: data.item } }))
    await this.runWorkflowActions(rootActions, triggerOutputsList, workflowRun)
  }

  async startWorkflowRun(
    workflowId: ObjectId,
    triggerOutputs: TriggerOutputs,
    workflowRun: WorkflowRun,
  ): Promise<void> {
    const rootActions = await this.workflowActionService.find({ workflow: workflowId, isRootAction: true })
    await this.runWorkflowActions(rootActions, [triggerOutputs], workflowRun)
  }

  async runWorkflowActions(
    rootActions: WorkflowAction[],
    triggerOutputsList: TriggerOutputs[],
    workflowRun: WorkflowRun,
  ): Promise<void> {
    const workflow = await this.workflowService.findById(workflowRun.workflow.toString())
    if (!workflow) {
      this.logger.error(`Workflow ${workflowRun.workflow} not found`)
      return
    }
    if (workflow.isTemplate) {
      this.logger.error(`Workflow ${workflow.id} is a template and cannot be run`)
      return
    }
    const statuses: WorkflowRunStatus[] = []
    for (const triggerOutputs of triggerOutputsList) {
      const promises = rootActions.map((action) =>
        this.runWorkflowActionsTree(workflow, action, triggerOutputs.outputs, workflowRun, triggerOutputs.id),
      )
      const res = await Promise.all(promises)
      statuses.push(...res)
      await wait(200)
    }
    if (!this.processInterrupted && statuses.every((status) => status === WorkflowRunStatus.completed)) {
      await this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
      await this.workflowTriggerService.updateOneNative({ workflow: workflow._id }, { consecutiveActionFails: 0 })
    }
  }

  async runWorkflowActionsTree(
    workflow: Workflow,
    workflowAction: WorkflowAction,
    previousOutputs: Record<string, Record<string, unknown>>,
    workflowRun: WorkflowRun,
    triggerItemId: TriggerItemId,
    resumingWorkflowRunAction?: WorkflowRunAction,
  ): Promise<WorkflowRunStatus> {
    this.logger.log(`Running workflow action ${workflowAction.id} for workflow ${workflowAction.workflow}`)

    const userId = new ObjectId(workflowAction.owner.toString())
    const user = await this.userService.findById(userId.toString())
    if (!user) {
      this.logger.error(`User ${userId} not found`)
      return WorkflowRunStatus.failed
    }
    if (user.operationsUsedMonth >= user.planConfig.maxOperations && user.planConfig.hardLimits) {
      this.logger.log(`User ${user.id} has reached the monthly operation limit`)
      await this.workflowTriggerService.markUserPlanAsLimited(user._id)
      return WorkflowRunStatus.failed
    }

    const integrationAction = await this.integrationActionService.findById(workflowAction.integrationAction.toString())
    if (!integrationAction) {
      this.logger.error(`IntegrationAction ${workflowAction.integrationAction} not found`)
      return WorkflowRunStatus.failed
    }
    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      this.logger.error(`Integration ${integrationAction.integration} not found`)
      return WorkflowRunStatus.failed
    }

    const workflowRunAction =
      resumingWorkflowRunAction ??
      (await this.workflowRunService.addRunningAction(
        workflowRun._id,
        workflowAction._id,
        triggerItemId,
        integration.name,
        integrationAction.name,
      ))

    const { credentials, accountCredential, integrationAccount } = await this.getCredentialsDataForWorkflowAction(
      integration,
      workflow,
      previousOutputs,
      workflowAction.credentials?.toString(),
      workflowAction.owner.toString(),
      () => this.onActionFailure(workflow, workflowRun, workflowRunAction, 'Credentials not found'),
    )

    if (this.processInterrupted) {
      this.logger.log(`Interrupting workflow run ${workflowRun.id} of workflow ${workflow.id}`)
      await this.workflowRunService.interruptWorkflowRun(workflowRun, workflowRunAction, previousOutputs)
      return WorkflowRunStatus.running
    }

    let inputs: Record<string, unknown>
    try {
      // add contact info on-demand
      if (previousOutputs.contact?.address) {
        previousOutputs.contact = await this.addRequestedContactDetails(
          previousOutputs.contact,
          workflowAction.inputs,
          user,
        )
      }
      for (const [key, value] of Object.entries(previousOutputs)) {
        if ((value.contact as any)?.address && !['trigger', 'contact'].includes(key)) {
          previousOutputs[key].contact = await this.addRequestedContactDetails(
            previousOutputs[key].contact as any,
            workflowAction.inputs,
            user,
            `${key}.contact`,
          )
        }
      }

      // add menu info on-demand
      if (workflow.type === 'chatbot') {
        previousOutputs.menu = await this.addRequestedMenuDetails(
          previousOutputs.menu ?? {},
          workflowAction.inputs,
          user,
        )
      }

      // don't parse inputs for the internal code action
      if (integration.key === 'internal' && integrationAction.key === 'runInternalCode') {
        inputs = workflowAction.inputs
      } else {
        inputs = parseStepInputs({ ...workflowAction.inputs }, previousOutputs)
      }
    } catch (e) {
      await this.onActionFailure(
        workflow,
        workflowRun,
        workflowRunAction,
        `Invalid inputs (${e.message})`,
        undefined,
        previousOutputs,
      )
      this.logger.error(
        `Parse step inputs for action ${workflowAction.id} for workflow ${workflow.id} failed with error ${e.message}`,
      )
      return WorkflowRunStatus.failed
    }

    let runResponse: RunResponse
    try {
      const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
      runResponse = await this.operationRunnerService.runAction(definition, {
        workflow,
        integration,
        integrationAccount,
        operation: integrationAction,
        inputs,
        credentials,
        accountCredential,
        workflowOperation: workflowAction,
        user,
        previousOutputs,
      })
      await this.workflowActionService.updateById(workflowAction._id, {
        lastItem: runResponse.outputs ?? {},
        ...(runResponse.store && { store: runResponse.store }),
      })
      await this.workflowRunService.markActionAsCompleted(
        userId,
        workflowRun._id,
        workflowRunAction,
        runResponse.credits ?? 1,
        runResponse.transactions,
        !!runResponse.sleepUniqueGroup,
      )
    } catch (e) {
      if (e instanceof AuthenticationError) {
        if (accountCredential) {
          await this.accountCredentialService.updateOne(accountCredential.id, { authExpired: true })
        }
      }
      if (e instanceof OperationDailyLimitError) {
        // since the daily limit has been exceeded, there is no need of checking the trigger until the next day
        const workflowTrigger = await this.workflowTriggerService.findOne({ workflow: workflow._id })
        const nextDayAtMidnight = new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        // nextCheck is at a random time between midnight and 2am
        const nextCheck = new Date(nextDayAtMidnight.getTime() + Math.round(2 * 60 * 60 * 1000 * Math.random()))
        if (workflowTrigger?.nextCheck && nextCheck.getTime() > workflowTrigger.nextCheck.getTime()) {
          this.logger.log(
            `An operation of workflow ${workflow.id} has reached its daily limit (${integrationAction.key}). Next check: ${nextCheck}`,
          )
          await this.workflowTriggerService.updateOneNative(
            { _id: workflowTrigger._id },
            {
              nextCheck,
            },
          )
        }
      }
      const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
      let error = definition.parseError(e)
      if (!error || error.toString() === '[object Object]') {
        error = e.message
      }
      await this.onActionFailure(
        workflow,
        workflowRun,
        workflowRunAction,
        error?.toString(),
        e.response?.text || undefined,
        inputs,
      )
      this.logger.error(
        `Run WorkflowAction ${workflowAction.id} for workflow ${workflow.id} failed with error ${error}`,
      )
      return WorkflowRunStatus.failed
    }

    // remove expired credentials
    if (accountCredential?.authExpired) {
      await this.accountCredentialService.updateOne(accountCredential.id, { authExpired: false })
    }

    // store refreshed credentials
    if (accountCredential && runResponse.refreshedCredentials) {
      this.accountCredentialService.updateOne(accountCredential.id, {
        credentialInputs: {
          ...accountCredential.credentials,
          ...runResponse.refreshedCredentials,
        },
      })
    }

    // learn schema response at integration or workflow level
    if (!isEmptyObj(runResponse?.outputs ?? {})) {
      if (integrationAction.learnResponseIntegration && !integrationAction.schemaResponse) {
        integrationAction.schemaResponse = this.getSchemaResponse(runResponse)
        await this.integrationActionService.updateOne(integrationAction.id, {
          schemaResponse: integrationAction.schemaResponse,
        })
      }
      if (
        (integrationAction.learnResponseWorkflow && !workflowAction.schemaResponse) ||
        runResponse.learnResponseWorkflow
      ) {
        workflowAction.schemaResponse = this.getSchemaResponse(runResponse)
        await this.workflowActionService.updateOne(workflowAction.id, {
          schemaResponse: workflowAction.schemaResponse,
        })
      }
    }

    const nextActionInputs = {
      ...previousOutputs,
      [workflowAction.id]: runResponse.outputs,
    }

    if (runResponse.sleepUntil || runResponse.sleepUniqueGroup) {
      await this.workflowRunService.sleepWorkflowRun(
        workflow,
        workflowRun,
        workflowAction,
        nextActionInputs,
        triggerItemId,
        runResponse.sleepUntil,
        runResponse.sleepUniqueGroup,
        runResponse.repeatOnWakeUp,
      )
      return WorkflowRunStatus.sleeping
    }

    // Filter out actions with conditions not met
    const nextActions = (workflowAction.nextActions ?? []).filter((nextAction) => {
      if (runResponse.stop) {
        return false
      }
      if (!nextAction.condition) {
        return true
      }
      return nextAction.condition === runResponse.condition
    })

    if (runResponse.repeatKey) {
      const repeatItems = _.get(runResponse.outputs, runResponse.repeatKey)

      if (!Array.isArray(repeatItems)) {
        throw new Error(`Invalid repeatKey ${runResponse.repeatKey} for action ${workflowAction.id}`)
      }

      for (const workflowNextAction of nextActions) {
        const nextAction = await this.workflowActionService.findById(workflowNextAction.action.toString())
        if (!nextAction) {
          this.logger.error(`WorkflowAction ${workflowNextAction.action} not found`)
          return WorkflowRunStatus.failed
        }
        for (const item of repeatItems) {
          nextActionInputs[workflowAction.id] = item
          await this.runWorkflowActionsTree(workflow, nextAction, nextActionInputs, workflowRun, triggerItemId)
          await wait(200)
        }
      }
      return WorkflowRunStatus.completed
    }

    for (const workflowNextAction of nextActions) {
      const nextAction = await this.workflowActionService.findById(workflowNextAction.action.toString())
      if (!nextAction) {
        this.logger.error(`WorkflowAction ${workflowNextAction.action} not found`)
        return WorkflowRunStatus.failed
      }
      await this.runWorkflowActionsTree(workflow, nextAction, nextActionInputs, workflowRun, triggerItemId)
    }
    return WorkflowRunStatus.completed
  }

  async getCredentialsDataForWorkflowAction(
    integration: Integration,
    workflow: Workflow,
    previousOutputs: Record<string, Record<string, unknown>>,
    credentialsId: string | undefined,
    ownerId: string,
    onError: () => any,
  ) {
    if (workflow.type !== 'chatbot' || !['chatbot', 'orders'].includes(integration.key)) {
      return this.getCredentialsAndIntegrationAccount(credentialsId, ownerId, onError)
    }

    if (!ownerId) {
      await onError()
      return {
        credentials: {},
        accountCredential: null,
        integrationAccount: null,
      }
    }

    const env = previousOutputs?.trigger?.env
    if (!env || typeof env !== 'string') {
      await onError()
      return {
        credentials: {},
        accountCredential: null,
        integrationAccount: null,
      }
    }

    const integrationAccount = await this.integrationAccountService.findOne({ key: 'xmtp' })
    const xmtpEnv = env.split(':')[1]
    const accountCredentials = await this.accountCredentialService.find({
      owner: ownerId,
      integrationAccount: integrationAccount!.id,
    })
    const accountCredential = accountCredentials.find(
      (ac) => ac.fields?.env === xmtpEnv || (xmtpEnv === 'production' && !ac.fields?.env),
    )
    if (!accountCredential || accountCredential.owner.toString() !== ownerId) {
      await onError()
      return {
        credentials: {},
        accountCredential: null,
        integrationAccount,
      }
    }
    const credentials = accountCredential.credentials ?? {}
    return { credentials, accountCredential, integrationAccount }
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
    if (!ownerId) {
      await onError()
      return {
        credentials: {},
        accountCredential: null,
        integrationAccount: null,
      }
    }
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
   * Run specific trigger items from their latest completed action
   * Useful for continuing an interrupted workflow run (for trigger items already started)
   */
  async runTriggerItemsFromLatestAction(workflowRun: WorkflowRun, triggerItems: TriggerItem[]): Promise<boolean> {
    const workflow = await this.workflowService.findOne(workflowRun.workflow)
    if (!workflow) {
      return false
    }
    const workflowActions = await this.workflowActionService.find({
      workflow: workflowRun.workflow,
    })
    for (const triggerItem of triggerItems) {
      // find the incompleted action for the trigger id
      const workflowRunAction = workflowRun.actionRuns.find(
        (runAction) =>
          runAction.itemId.toString() === triggerItem.id.toString() && runAction.status === WorkflowRunStatus.running,
      )
      const workflowAction = workflowActions.find(
        (action) => action.id.toString() === workflowRunAction?.workflowAction.toString(),
      )
      if (!workflowAction || !workflowRunAction) {
        this.logger.error(
          `Error resuming a workflow run: A running action was not found for workflow run ${workflowRun.id} and item ${triggerItem.id}`,
        )
        continue
      }
      const previousOutputs = await this.workflowRunService.getWorkflowRunActionPreviousOutputs(workflowRunAction._id)
      if (!previousOutputs) {
        this.logger.error(
          `Error resuming a workflow run: the previous outputs were not found for workflow run ${workflowRun.id} and item ${triggerItem.id}`,
        )
        continue
      }
      await this.runWorkflowActionsTree(
        workflow,
        workflowAction,
        previousOutputs,
        workflowRun,
        triggerItem.id,
        workflowRunAction,
      )
    }
    return true
  }

  /**
   * Run specific trigger items from the workflow's root action
   * Useful for continuing an interrupted workflow run (for trigger items never started)
   */
  async runTriggerItemsFromRootAction(workflowRun: WorkflowRun, triggerItems: TriggerItem[]): Promise<void> {
    const workflowTrigger = await this.workflowTriggerService.findOne({
      workflow: workflowRun.workflow,
    })
    const workflowActions = await this.workflowActionService.find({
      workflow: workflowRun.workflow,
      isRootAction: true,
    })

    // workflow trigger or all workflow actions were removed
    if (!workflowTrigger || !workflowActions.length) {
      await this.workflowRunService.updateOneNative(
        { _id: workflowRun._id },
        {
          $set: { status: !workflowTrigger ? WorkflowRunStatus.failed : WorkflowRunStatus.completed },
          $unset: { lockedAt: '' },
        },
      )
      return
    }

    if (workflowRun.retries && workflowRun.retries >= 2) {
      this.logger.log(`Workflow run timed out after too many retries: ${workflowRun._id}`)
      await this.workflowRunService.updateWorkflowRunStatus(workflowRun._id, WorkflowRunStatus.failed)
      return
    }

    // lock the execution if we have the latest version of the object (to avoid concurrent runs between workers)
    const res = await this.workflowRunService.updateOneNative(
      { _id: workflowRun._id, __v: (workflowRun as Document).__v },
      {
        $set: {
          lockedAt: new Date(),
          ...(!workflowRun.retries ? { retries: 1 } : {}),
        },
        ...(workflowRun.retries ? { $inc: { retries: 1 } } : {}),
      },
    )
    if (!res.modifiedCount) {
      return
    }

    const triggerOutputs = triggerItems.map((item) => ({
      id: item.id,
      outputs: { [workflowTrigger.id]: item.item, trigger: item.item },
    }))
    this.logger.log(`Retrying workflow run: ${workflowRun._id} with ${triggerOutputs.length} items`)
    await this.runWorkflowActions(workflowActions, triggerOutputs, workflowRun)
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
      const workflow = await this.workflowService.findById(workflowAction.workflow.toString())
      if (!workflow) {
        return
      }
      await this.workflowRunService.wakeUpWorkflowRun(workflowRun)
      const nextActionInputs = (workflowSleep.nextActionInputs ?? {}) as Record<string, Record<string, unknown>>
      const actions = await this.workflowActionService.findByIds(
        workflowAction.nextActions.map((next) => next.action) as mongoose.Types.ObjectId[],
      )
      const promises = actions.map((action) =>
        this.runWorkflowActionsTree(workflow, action, nextActionInputs, workflowRun, workflowSleep.itemId),
      )
      await Promise.all(promises)
      await this.workflowRunService.markWorkflowRunAsCompleted(workflowRun._id)
    }
  }

  async addRequestedContactDetails(
    contact: Record<string, any>,
    inputs: Record<string, unknown>,
    user: User,
    inputsKey: string = 'contact',
  ) {
    const contactKeys = findOutputKeys(inputs, inputsKey)
    for (const key of contactKeys) {
      if (!contact[key]) {
        contact[key] = await this.contactService.resolveContactData(contact.address, key, user)
      }
    }
    return contact
  }

  async addRequestedMenuDetails(menu: Record<string, any>, inputs: Record<string, unknown>, user: User) {
    const menuKeys = findOutputKeys(inputs, 'menu')
    for (const key of menuKeys) {
      if (!menu[key] && typeof key === 'string') {
        menu[key] = await this.menuService.resolveMenu(key, user)
      }
    }
    return menu
  }

  private async onTriggerFailure(
    workflow: Workflow,
    workflowTrigger: WorkflowTrigger,
    workflowRunData: Partial<WorkflowRun>,
    errorMessage: string | undefined,
    errorResponse?: string,
    inputs?: Record<string, any>,
  ): Promise<void> {
    const workflowRun = await this.workflowRunService.createFailedTriggerRun(
      workflow,
      workflowRunData,
      errorMessage,
      errorResponse,
      inputs,
    )
    await this.workflowTriggerService.updateOneNative(
      { _id: workflowTrigger._id },
      {
        lastCheck: new Date(),
      },
    )
    await this.runWorkflowOnFailure(workflow._id, workflowRun, errorMessage, errorResponse, inputs)
  }

  private async onActionFailure(
    workflow: Workflow,
    workflowRun: WorkflowRun,
    workflowAction: WorkflowRunAction,
    errorMessage: string | undefined,
    errorResponse?: string,
    inputs?: Record<string, any>,
  ): Promise<void> {
    await this.workflowRunService.markActionAsFailed(
      workflow,
      workflowRun,
      workflowAction,
      errorMessage,
      errorResponse,
      inputs,
    )
    await this.runWorkflowOnFailure(workflow._id, workflowRun, errorMessage, errorResponse, inputs)
  }

  private async runWorkflowOnFailure(
    workflowId: ObjectId | Reference<Workflow, mongoose.Types.ObjectId>,
    workflowRun: WorkflowRun,
    errorMessage: string | undefined,
    errorResponse?: string,
    inputs?: Record<string, any>,
  ): Promise<void> {
    const workflow = await this.workflowService.findById(workflowId.toString())
    if (workflow?.runOnFailure) {
      const newWorkflowRun = await this.workflowRunService.createOne({
        owner: workflow.owner,
        workflow: workflow.runOnFailure,
        status: WorkflowRunStatus.running,
        startedBy: WorkflowRunStartedByOptions.workflowFailure,
      })
      const triggerOutputs: TriggerOutputs = {
        id: workflowRun._id.toString(),
        outputs: {
          trigger: {
            workflowRunId: workflowRun._id,
            errorMessage,
            errorResponse,
            inputs,
          },
        },
      }
      await this.startWorkflowRun(new ObjectId(workflow.runOnFailure.toString()), triggerOutputs, newWorkflowRun)
    }
  }

  private getSchemaResponse(runResponse: RunResponse) {
    if (runResponse.repeatKey) {
      const item = _.get(runResponse.outputs, runResponse.repeatKey) as Record<string, any>
      return generateSchemaFromObject(item?.[0])
    }
    return generateSchemaFromObject(runResponse.outputs)
  }
}
