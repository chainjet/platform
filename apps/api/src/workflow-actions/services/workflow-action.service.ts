import { BaseService } from '@app/common/base/base.service'
import { ObjectID } from '@app/common/utils/mongodb'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
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
    protected workflowService: WorkflowService,
    protected workflowTriggerService: WorkflowTriggerService,
    protected accountCredentialService: AccountCredentialService,
    protected integrationDefinitionFactory: IntegrationDefinitionFactory,
  ) {
    super(model)
  }

  // TODO verify record complies with schema
  async createOne(record: DeepPartial<WorkflowAction>): Promise<WorkflowAction> {
    this.logger.debug(`Create workflow action request with data: ${JSON.stringify(record)}`)
    const data = record as CreateWorkflowActionInput & DeepPartial<WorkflowAction>

    if (!data.workflow || !data.owner || !data.integrationAction) {
      throw new NotFoundException('Workflow not found')
    }

    // Verify workflow exist and the user has access to it
    const workflow = await this.workflowService.findById(data.workflow.toString())
    if (!workflow?.owner || workflow.owner.toString() !== data.owner.toString()) {
      throw new NotFoundException('Workflow not found')
    }

    // Verify credentials exists and the user has access to it
    let accountCredential: AccountCredential | null = null
    if (data.credentials) {
      accountCredential = (await this.accountCredentialService.findById(data.credentials.toString())) ?? null
      if (!accountCredential?.owner || accountCredential.owner.toString() !== data.owner.toString()) {
        throw new NotFoundException('Account credentials not found')
      }
    }

    // Verify previous action exists and the user has access to it
    let previousAction: WorkflowAction | undefined
    if (data.previousAction) {
      previousAction = await this.findById(data.previousAction.toString())
      if (!previousAction?.owner || previousAction.owner.toString() !== data.owner.toString()) {
        throw new NotFoundException('Action not found')
      }
    }

    // Verify next action exists and the user has access to it
    let nextAction: WorkflowAction | undefined
    if (data.nextAction) {
      nextAction = await this.findById(data.nextAction.toString())
      if (!nextAction?.owner || nextAction.owner.toString() !== data.owner.toString()) {
        throw new NotFoundException('Action not found')
      }
      data.nextActions = [{ action: nextAction._id }]
    }

    // Mark the action as first action
    if (!previousAction) {
      data.isRootAction = true
    }

    const integrationAction = await this.integrationActionService.findById(data.integrationAction.toString())
    if (!integrationAction) {
      throw new NotFoundException('Integration action not found')
    }

    const integration = await this.integrationService.findById(integrationAction.integration.toString())
    if (!integration) {
      throw new NotFoundException(`Integration ${integrationAction.integration} not found`)
    }

    data.name = capitalize(integrationAction.name)

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const workflowAction = await definition.beforeCreateWorkflowAction(data, integrationAction, accountCredential)

    this.logger.debug(`Creating record: ${JSON.stringify(workflowAction)}`)
    const createdWorkflowAction = await super.createOne(workflowAction)
    await definition.afterCreateWorkflowAction(createdWorkflowAction, integrationAction, accountCredential, (data) =>
      super.updateOne(createdWorkflowAction.id, data),
    )

    // Update the nextActions references on the previous action
    if (previousAction) {
      const nextActions = [
        ...previousAction.nextActions,
        { action: new ObjectID(createdWorkflowAction.id), condition: data.previousActionCondition ?? undefined },
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
    if (data.isRootAction) {
      const trigger = await this.workflowTriggerService.findOne({ workflow: workflow.id })
      if (trigger && !trigger.nextCheck) {
        await this.workflowTriggerService.updateNextCheck(trigger)
      }
    }

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

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    const updatedWorkflowAction = await definition.beforeUpdateWorkflowAction(
      update,
      integrationAction,
      accountCredential,
    )
    const updatedEntity = await super.updateOne(id, updatedWorkflowAction, opts)
    await definition.afterUpdateWorkflowAction(updatedEntity, integrationAction, accountCredential, (data) =>
      super.updateOne(updatedEntity.id, data, opts),
    )
    return updatedEntity
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<WorkflowAction> | undefined): Promise<WorkflowAction> {
    // Verify action exist and the user has access to it
    const workflowAction = await this.findById(id, opts)
    if (!workflowAction) {
      throw new NotFoundException('Workflow action not found')
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

    const definition = this.integrationDefinitionFactory.getDefinition(integration.parentKey ?? integration.key)
    await definition.beforeDeleteWorkflowAction(workflowAction, integrationAction, accountCredential)
    const deletedEntity = super.deleteOne(id, opts)
    await definition.afterDeleteWorkflowAction(workflowAction, integrationAction, accountCredential)
    return deletedEntity
  }
}
