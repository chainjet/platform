import { BaseService } from '@app/common/base/base.service'
import { ObjectID } from '@app/common/utils/mongodb'
import { OperationType } from '@app/definitions/types/OperationType'
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { isAddress } from 'ethers/lib/utils'
import { InjectModel } from 'nestjs-typegoose'
import { capitalize } from '../../../../../libs/common/src/utils/string.utils'
import { IntegrationDefinitionFactory } from '../../../../../libs/definitions/src/integration-definition.factory'
import { AccountCredential } from '../../account-credentials/entities/account-credential'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { IntegrationActionService } from '../../integration-actions/services/integration-action.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { CreateWorkflowActionInput, WorkflowAction } from '../entities/workflow-action'
import { WorkflowNextAction } from '../entities/workflow-next-action'

@Injectable()
export class WorkflowActionService extends BaseService<WorkflowAction> {
  protected readonly logger = new Logger(WorkflowActionService.name)

  constructor(
    @InjectModel(WorkflowAction) protected readonly model: ReturnModelType<typeof WorkflowAction>,
    protected integrationService: IntegrationService,
    protected integrationActionService: IntegrationActionService,
    @Inject(forwardRef(() => WorkflowService)) protected workflowService: WorkflowService,
    protected workflowTriggerService: WorkflowTriggerService,
    protected accountCredentialService: AccountCredentialService,
    @Inject(forwardRef(() => IntegrationDefinitionFactory))
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {
    super(model)
  }

  // TODO verify record complies with schema
  async createOne(record: CreateWorkflowActionInput & DeepPartial<WorkflowAction>): Promise<WorkflowAction> {
    this.logger.debug(`Create workflow action request with data: ${JSON.stringify(record)}`)

    if (!record.workflow || !record.owner || !record.integrationAction) {
      throw new NotFoundException('Workflow not found')
    }

    // Verify workflow exist and the user has access to it
    const workflow = await this.workflowService.findById(record.workflow.toString())
    if (!workflow?.owner || workflow.owner.toString() !== record.owner.toString()) {
      throw new NotFoundException('Workflow not found')
    }

    record.isPublic = workflow.isPublic

    // Verify credentials exists and the user has access to it
    let accountCredential: AccountCredential | null = null
    if (record.credentials) {
      accountCredential = (await this.accountCredentialService.findById(record.credentials.toString())) ?? null
      if (!accountCredential?.owner || accountCredential.owner.toString() !== record.owner.toString()) {
        throw new NotFoundException('Account credentials not found')
      }
    }

    // Verify previous action exists and belongs to the same workflow
    let previousAction: WorkflowAction | undefined
    if (record.previousAction) {
      previousAction = await this.findById(record.previousAction.toString())
      if (
        !previousAction?.owner ||
        previousAction.owner.toString() !== record.owner.toString() ||
        previousAction.workflow.toString() !== record.workflow.toString()
      ) {
        throw new NotFoundException('Action not found')
      }
    }

    // Verify next action exists and belongs to the same workflow
    let nextAction: WorkflowAction | undefined
    if (record.nextAction) {
      nextAction = await this.findById(record.nextAction.toString())
      if (
        !nextAction?.owner ||
        nextAction.owner.toString() !== record.owner.toString() ||
        nextAction.workflow.toString() !== record.workflow.toString()
      ) {
        throw new NotFoundException('Action not found')
      }
      record.nextActions = [{ action: nextAction._id }]
    }

    // Mark the action as first action
    if (!previousAction) {
      record.isRootAction = true
    }

    const integrationAction = await this.integrationActionService.findById(record.integrationAction.toString())
    if (!integrationAction) {
      throw new NotFoundException('Integration action not found')
    }
    record.type = integrationAction.type
    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationAction.integration} not found`)
    }

    this.logger.log(`Creating workflow action for ${integration.key} - ${integrationAction.key} by ${record.owner}`)

    const workflowTrigger = await this.workflowTriggerService.findOne({ workflow: workflow.id })

    if (integrationAction.type === OperationType.EVM) {
      // set workflow network if it has on-chain actions
      if (workflow.network && workflow.network.toString() !== record.inputs.network.toString()) {
        throw new BadRequestException(
          `Workflow network ${workflow.network} does not match action network ${record.inputs.network}`,
        )
      } else if (!workflow.network) {
        await this.workflowService.updateOne(workflow.id, { network: record.inputs.network })
        if (workflowTrigger?.enabled) {
          await this.workflowTriggerService.updateOne(workflowTrigger.id, { enabled: false })
        }
      }

      // set is evm root action
      if (!previousAction || previousAction.type !== OperationType.EVM) {
        record.isContractRootAction = true
      }
    }

    record.name = record.name ?? capitalize(integrationAction.name)

    const isTemplate = await this.workflowService.updateTemplateSettings(
      workflow,
      integrationAction.id,
      'action',
      record.inputs ?? {},
    )

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)

    // refresh credentials if needed
    if (accountCredential && !isTemplate) {
      const refreshedAccount = await this.accountCredentialService.refreshCredentials(
        accountCredential,
        definition,
        integration,
      )
      accountCredential = refreshedAccount ?? accountCredential
    }

    const workflowAction = isTemplate
      ? record
      : await definition.beforeCreateWorkflowAction(record, integrationAction, accountCredential)

    this.logger.debug(`Creating workflow action: ${JSON.stringify(workflowAction)}`)
    const createdWorkflowAction = await super.createOne(workflowAction)
    if (!isTemplate) {
      await definition.afterCreateWorkflowAction(createdWorkflowAction, integrationAction, accountCredential, (data) =>
        super.updateOne(createdWorkflowAction.id, data),
      )
    }

    // Update the nextActions references on the previous action
    if (previousAction) {
      const nextActions = [
        ...previousAction.nextActions,
        { action: new ObjectID(createdWorkflowAction.id), condition: record.previousActionCondition ?? undefined },
      ] as Array<WorkflowNextAction>

      // If both a previous and next actions were given, means that the action is being added in between 2 actions.
      // So we need to remove nextAction from the array.
      if (nextAction) {
        const index = nextActions.findIndex(
          (next) => nextAction && next.action && next.action.toString() === nextAction.id,
        )
        if (index !== -1) {
          nextActions.splice(index, 1)
        }
      }

      await this.updateOne(previousAction.id, { nextActions })
    }

    // Make sure the action on next action is not marked as first action on the workflow
    if (nextAction?.isRootAction) {
      await this.updateOne(nextAction.id, { isRootAction: false })
    }

    // Initialize trigger nextCheck
    if (record.isRootAction) {
      if (workflowTrigger && !workflowTrigger.nextCheck) {
        await this.workflowTriggerService.updateNextCheck(workflowTrigger)
      }
    }

    await this.workflowService.updateUsedIntegrations(workflow)

    return createdWorkflowAction
  }

  async updateOne(
    id: string,
    update: DeepPartial<WorkflowAction>,
    opts?: UpdateOneOptions<WorkflowAction> | undefined,
  ): Promise<WorkflowAction> {
    const workflowAction = await this.findById(id, opts)
    if (!workflowAction) {
      throw new Error(`Workflow action "${id}" not found`)
    }

    const workflow = await this.workflowService.findById(workflowAction.workflow.toString())
    if (!workflow) {
      throw new Error(`Workflow "${workflowAction.workflow}" not found`)
    }

    if (workflow.network && workflow.address) {
      throw new Error('Cannot update workflow action after the workflow was deployed')
    }

    // verify contract address and save it on the workflow
    if (update.address) {
      if (workflowAction.address && workflowAction.address !== update.address) {
        throw new Error('Cannot update workflow action address after it was deployed')
      }
      if (!workflowAction.isContractRootAction) {
        throw new BadRequestException('Address can only be set on contract root actions')
      }
      if (!isAddress(update.address)) {
        throw new BadRequestException('Invalid contract address')
      }
      workflow.address = update.address
      await this.workflowService.updateOne(workflow.id, { address: update.address })
    }

    const integrationAction = await this.integrationActionService.findById(workflowAction.integrationAction.toString())
    if (!integrationAction) {
      throw new NotFoundException('Integration action not found')
    }

    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationAction.integration} not found`)
    }

    // Verify credentials exists and the user has access to it
    let accountCredential: AccountCredential | null = null
    const credentialsId = update.credentials?.toString() ?? workflowAction.credentials?.toString()
    if (credentialsId) {
      accountCredential = (await this.accountCredentialService.findById(credentialsId)) ?? null
      if (!accountCredential?.owner || accountCredential.owner.toString() !== workflowAction.owner.toString()) {
        throw new NotFoundException('Account credentials not found')
      }
    }

    const isTemplate = await this.workflowService.updateTemplateSettings(
      workflow,
      integrationAction.id,
      'action',
      update.inputs ?? {},
      workflowAction.inputs,
    )

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const updatedWorkflowAction = isTemplate
      ? update
      : await definition.beforeUpdateWorkflowAction(update, integrationAction, accountCredential)
    const updatedEntity = await super.updateOne(id, updatedWorkflowAction, opts)

    if (!isTemplate) {
      await definition.afterUpdateWorkflowAction(updatedEntity, integrationAction, accountCredential, (data) =>
        super.updateOne(updatedEntity.id, data, opts),
      )
    }

    return updatedEntity
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<WorkflowAction> | undefined): Promise<WorkflowAction> {
    // Verify action exist and the user has access to it
    const workflowAction = await this.findById(id, opts)
    if (!workflowAction) {
      throw new NotFoundException('Workflow action not found')
    }

    const workflow = await this.workflowService.findById(workflowAction.workflow.toString())
    if (!workflow) {
      return super.deleteOne(id, opts)
    }

    if (workflow.network && workflow.address) {
      throw new Error('Cannot delete workflow action after the workflow was deployed')
    }

    // Update isRootAction on next actions
    if (workflowAction.isRootAction && workflowAction.nextActions.length) {
      const nextActionIds = workflowAction.nextActions.map((next) => next.action)
      await this.update({ _id: { $in: nextActionIds } }, { $set: { isRootAction: true } })
    }

    // Remove action from nextActions references. The workflow is included on the query so the index is used.
    const actions = await this.find({ workflow: workflowAction.workflow, 'nextActions.action': workflowAction._id })
    for (const action of actions) {
      if (action.owner.toString() !== workflowAction.owner.toString()) {
        throw new NotFoundException('Workflow action not found')
      }
      const nextActions = [...action.nextActions, ...workflowAction.nextActions] as Array<WorkflowNextAction>
      const index = nextActions.findIndex((next) => next.action && next.action.toString() === workflowAction.id)
      if (index !== -1) {
        nextActions.splice(index, 1)
        await this.updateOne(action.id, { nextActions }, opts)
      }
    }

    const integrationAction = await this.integrationActionService.findById(workflowAction.integrationAction.toString())
    if (!integrationAction) {
      return super.deleteOne(id, opts)
    }

    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      return super.deleteOne(id, opts)
    }

    let accountCredential: AccountCredential | null = null
    if (workflowAction.credentials) {
      accountCredential = (await this.accountCredentialService.findById(workflowAction.credentials.toString())) ?? null
      // this check isn't needed, but doesn't hurt either
      if (accountCredential && accountCredential.owner.toString() !== workflowAction.owner.toString()) {
        throw new BadRequestException()
      }
    }

    const isTemplate = await this.workflowService.updateTemplateSettings(
      workflow,
      integrationAction.id,
      'action',
      {},
      workflowAction.inputs,
    )

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    if (!isTemplate) {
      await definition.beforeDeleteWorkflowAction(workflowAction, integrationAction, accountCredential)
    }
    const deletedEntity = super.deleteOne(id, opts)
    if (!isTemplate) {
      await definition.afterDeleteWorkflowAction(workflowAction, integrationAction, accountCredential)
    }

    await this.workflowService.updateUsedIntegrations(workflow)

    return deletedEntity
  }
}
