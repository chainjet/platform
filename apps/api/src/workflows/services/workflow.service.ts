import { BaseService } from '@app/common/base/base.service'
import { replaceTemplateFields } from '@app/definitions/utils/field.utils'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import { InjectModel } from 'nestjs-typegoose'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { IntegrationActionService } from '../../integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { IntegrationService } from '../../integrations/services/integration.service'
import { UserService } from '../../users/services/user.service'
import { sortActionTree } from '../../workflow-actions/actions.utils'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../entities/workflow'

@Injectable()
export class WorkflowService extends BaseService<Workflow> {
  protected readonly logger = new Logger(WorkflowService.name)
  static instance: WorkflowService

  constructor(
    @InjectModel(Workflow) protected readonly model: ReturnModelType<typeof Workflow>,
    protected integrationService: IntegrationService,
    protected integrationTriggerSerice: IntegrationTriggerService,
    protected integrationActionService: IntegrationActionService,
    protected workflowTriggerService: WorkflowTriggerService,
    protected workflowActionService: WorkflowActionService,
    protected userService: UserService,
    protected accountCredentialService: AccountCredentialService,
  ) {
    super(model)
    WorkflowService.instance = this
  }

  async findByIdWithReadPermissions(id: string, userId: string): Promise<Workflow | null> {
    const workflow = await this.findById(id)
    if (!workflow) {
      return null
    }
    if (workflow.isPublic || workflow.owner.toString() === userId) {
      return workflow
    }
    return null
  }

  async createOne(record: DeepPartial<Workflow>): Promise<Workflow> {
    if (!record.owner || !record.name) {
      throw new BadRequestException()
    }

    const user = await this.userService.findById(record.owner.toString())
    if (!user) {
      throw new NotFoundException(`User ${record.owner} not found.`)
    }

    record.ownerAddress = user.address
    return await super.createOne(record)
  }

  async updateOne(id: string, record: DeepPartial<Workflow>, opts?: UpdateOneOptions<Workflow>): Promise<Workflow> {
    const workflow = await this.findById(id, opts)

    if (!workflow) {
      throw new NotFoundException()
    }

    if (record.runOnFailure?.toString() === workflow.id) {
      throw new BadRequestException('Run On Failure cannot be set with the same workflow ID.')
    }

    // propagate isPublic to the trigger and all actions
    if (record.isPublic !== undefined && record.isPublic !== workflow.isPublic) {
      await this.workflowTriggerService.updateOneNative({ workflow: new ObjectId(id) }, { isPublic: record.isPublic })
      await this.workflowActionService.updateManyNative({ workflow: new ObjectId(id) }, { isPublic: record.isPublic })
    }

    return await super.updateOne(id, record, opts)
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<Workflow>): Promise<Workflow> {
    await this.workflowTriggerService.deleteOneNative({ workflow: new ObjectId(id) })
    await this.workflowActionService.deleteManyNative({ workflow: new ObjectId(id) })
    return await super.deleteOne(id, opts)
  }

  async updateTemplateSettings(
    workflow: Workflow,
    inputs: Record<string, any>,
    oldInputs?: Record<string, any>,
  ): Promise<boolean> {
    const getTemplateFields = (inputs: Record<string, any>): string[] => {
      const result = Object.values(inputs).reduce((acc, value) => {
        if (typeof value === 'string') {
          const matches = value.matchAll(/{{\s*([^}]+)\s*}}/g)
          const results = Array.from(matches)
            .filter((match) => match[1].includes('template.'))
            .map((match) => match[1].trim().replace('template.', ''))
          return [...acc, ...results]
        }
        return acc
      }, [])
      return Array.from(new Set(result))
    }

    const newTemplateFields = getTemplateFields(inputs)
    const oldTemplateFields = getTemplateFields(oldInputs ?? {})

    // workflow is not a template
    if (!workflow.isTemplate && !newTemplateFields.length) {
      return false
    }

    // if the template didn't change, don't do anything
    if (
      newTemplateFields.length === oldTemplateFields.length &&
      newTemplateFields.every((value) => oldTemplateFields.includes(value))
    ) {
      return false
    }

    const schema = workflow.templateSchema ?? {
      type: 'object',
    }
    schema.properties = schema.properties ?? {}

    // delete old fields
    const deletedTemplateFields = oldTemplateFields.filter((value) => !newTemplateFields.includes(value))
    deletedTemplateFields.forEach((field) => {
      delete schema.properties![field]
    })

    // add new fields
    const addedTemplateFields = newTemplateFields.filter((value) => !oldTemplateFields.includes(value))
    addedTemplateFields.forEach((field) => {
      schema.properties![field] = {
        type: 'string',
      }
    })

    await this.updateById(workflow._id, { isTemplate: true, templateSchema: schema })
    return true
  }

  async fork(
    workflow: Workflow,
    userId: string,
    templateInputs: Record<string, any>,
    credentialIds: Record<string, string>,
  ): Promise<Workflow> {
    const user = await this.userService.findById(userId)
    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`)
    }
    const isOwner = workflow.owner.toString() === userId
    const accountCredentials = await this.accountCredentialService.find({
      _id: { $in: Object.values(credentialIds) },
      owner: new ObjectId(userId),
    })

    const forkedWorkflow = await this.createOne({
      owner: user._id,
      name: workflow.name,
      network: workflow.network,
      isTemplate: workflow.isTemplate,
      isPublic: workflow.isPublic,
      templateSchema: workflow.templateSchema,
      runOnFailure: isOwner ? workflow.runOnFailure : undefined,
    })

    const trigger = await this.workflowTriggerService.findOne({ workflow: workflow.id })
    if (!trigger) {
      throw new NotFoundException(`Trigger for workflow ${workflow.id} not found.`)
    }

    // get account credentials for the trigger
    const integrationTrigger = await this.integrationTriggerSerice.findById(trigger.integrationTrigger.toString())
    if (!integrationTrigger) {
      throw new NotFoundException(`Integration trigger ${trigger.integrationTrigger} not found.`)
    }
    const integrationForTrigger = await this.integrationService.findById(integrationTrigger.integration.toString())
    if (!integrationForTrigger) {
      throw new NotFoundException(`Integration ${integrationTrigger.integration} not found.`)
    }
    const credentialsForTrigger =
      integrationForTrigger.integrationAccount &&
      accountCredentials.find(
        (credential) =>
          credential.integrationAccount.toString() === integrationForTrigger.integrationAccount!.toString(),
      )

    const idsMap = new Map<string, string>()
    const forkedTrigger = await this.workflowTriggerService.createOne({
      owner: user._id,
      workflow: forkedWorkflow._id,
      integrationTrigger: trigger.integrationTrigger,
      name: trigger.name,
      inputs: replaceTemplateFields(idsMap, trigger.inputs ?? {}, templateInputs),
      credentials: credentialsForTrigger?.id,
      schedule: trigger.schedule,
      enabled: true,
      maxConsecutiveFailures: trigger.maxConsecutiveFailures,
      schemaResponse: isOwner ? trigger.schemaResponse : undefined,
      isPublic: workflow.isPublic,
    })
    idsMap.set(trigger.id, forkedTrigger.id)

    const actions = await this.workflowActionService.find({ workflow: workflow.id })
    const sortedActions = sortActionTree(actions)

    const previousActionMap = new Map<string, { id: string; condition: string | undefined }>()
    for (const action of sortedActions) {
      // we need to previous action to create the new action
      for (const nextAction of action.nextActions) {
        previousActionMap.set(nextAction.action.toString(), { id: action.id, condition: nextAction.condition })
      }

      // get account credentials for the action
      const integrationAction = await this.integrationActionService.findById(action.integrationAction.toString())
      if (!integrationAction) {
        throw new NotFoundException(`Integration action ${action.integrationAction} not found.`)
      }
      const integrationForAction = await this.integrationService.findById(integrationAction.integration.toString())
      if (!integrationForAction) {
        throw new NotFoundException(`Integration ${integrationAction.integration} not found.`)
      }
      const credentialsForAction =
        integrationForAction.integrationAccount &&
        accountCredentials.find(
          (credential) =>
            credential.integrationAccount.toString() === integrationForAction.integrationAccount!.toString(),
        )

      const previousAction = previousActionMap.get(action.id)
      const forkedAction = await this.workflowActionService.createOne({
        owner: user._id,
        workflow: forkedWorkflow._id,
        isRootAction: action.isRootAction,
        isContractRootAction: action.isContractRootAction,
        integrationAction: action.integrationAction,
        name: action.name,
        inputs: replaceTemplateFields(idsMap, action.inputs ?? {}, templateInputs),
        previousAction: idsMap.get(previousAction?.id ?? '') as any,
        previousActionCondition: previousAction?.condition,
        credentials: credentialsForAction?.id,
        schemaResponse: isOwner ? action.schemaResponse : undefined,
        type: action.type,
        isPublic: workflow.isPublic,
      })
      idsMap.set(action.id, forkedAction.id)
    }
    return forkedWorkflow
  }
}
