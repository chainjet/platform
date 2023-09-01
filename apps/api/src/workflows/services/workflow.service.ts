import { BaseService } from '@app/common/base/base.service'
import { fixObjectTypes, replaceTemplateFields } from '@app/definitions/utils/field.utils'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { findOutputKeys } from 'apps/runner/src/utils/input.utils'
import { JSONSchema7Definition } from 'json-schema'
import { ObjectId } from 'mongodb'
import { InjectModel } from 'nestjs-typegoose'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { MenuService } from '../../chat/services/menu.service'
import { IntegrationActionService } from '../../integration-actions/services/integration-action.service'
import { IntegrationTriggerService } from '../../integration-triggers/services/integration-trigger.service'
import { Integration } from '../../integrations/entities/integration'
import { IntegrationService } from '../../integrations/services/integration.service'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { sortActionTree } from '../../workflow-actions/actions.utils'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { TriggerSchedule } from '../../workflow-triggers/entities/trigger-schedule'
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
    protected menuService: MenuService,
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
    if (user.flagged) {
      throw new BadRequestException(
        'User is flagged as an automated bot. If you believe this is a mistake, please contact us at support@chainjet.io',
      )
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
    integrationOperationId: string,
    operationType: 'action' | 'trigger',
    inputs: Record<string, any>,
    oldInputs?: Record<string, any>,
  ): Promise<boolean> {
    const getTemplateFields = (inputs: Record<string, any>): { templateKey: string; inputKey: string }[] => {
      const result = Object.entries(inputs).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          const matches: IterableIterator<RegExpMatchArray> = value.matchAll(/{{\s*([^}]+)\s*}}/g)
          const results = Array.from(matches)
            .filter((match) => match[1].includes('template.'))
            .map((match) => match[1].trim().replace('template.', ''))
          return [...acc, ...results.map((res) => ({ templateKey: res, inputKey: key }))]
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
      return !!workflow.isTemplate
    }

    const schema = workflow.templateSchema ?? {
      type: 'object',
    }
    schema.properties = schema.properties ?? {}

    // delete old fields
    const deletedTemplateFields = oldTemplateFields.filter(
      (value) => !newTemplateFields.some((field) => field.templateKey === value.templateKey),
    )
    deletedTemplateFields.forEach((field) => {
      delete schema.properties![field.templateKey]
    })

    // add new fields
    const addedTemplateFields = newTemplateFields.filter(
      (value) => !oldTemplateFields.some((field) => field.templateKey === value.templateKey),
    )
    addedTemplateFields.forEach((field) => {
      if (inputs[field.inputKey].replace(/\s/g, '') === `{{template.${field.templateKey}}}`) {
        schema.properties![field.templateKey] = {
          type: 'string',
          'x-inheritField': {
            key: field.inputKey,
            ...(operationType === 'action'
              ? { integrationAction: integrationOperationId }
              : { integrationTrigger: integrationOperationId }),
          },
        } as JSONSchema7Definition
      } else {
        schema.properties![field.templateKey] = {
          type: 'string',
        }
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
    const isPublic = isOwner ? workflow.isPublic : false

    const forkedWorkflow = await this.createOne({
      owner: user._id,
      name: workflow.name,
      network: workflow.network,
      isPublic,
      type: workflow.type,
      templateSchema: workflow.templateSchema,
      runOnFailure: isOwner ? workflow.runOnFailure : undefined,
      forkOf: workflow._id,
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
      inputs: {
        ...templateInputs,
        ...fixObjectTypes(
          replaceTemplateFields(idsMap, trigger.inputs ?? {}, templateInputs),
          workflow.templateSchema ?? {},
        ),
      },
      credentials: credentialsForTrigger?.id,
      schedule: {
        ...trigger.schedule,
        ...replaceTemplateFields(idsMap, trigger.schedule ?? {}, templateInputs),
      } as TriggerSchedule,
      enabled: workflow.type !== 'chatbot', // chatbots are disabled by default
      maxConsecutiveFailures: trigger.maxConsecutiveFailures,
      schemaResponse: isOwner ? trigger.schemaResponse : undefined,
      isPublic,
    })
    idsMap.set(trigger.id, forkedTrigger.id)

    const actions = await this.workflowActionService.find({ workflow: workflow.id })
    const sortedActions = sortActionTree(actions)

    const previousActionMap = new Map<string, { id: string; condition: string | undefined }>()
    let menuMap = new Map<string, string>()
    for (const action of sortedActions) {
      // we need to previous action to create the new action
      for (const nextAction of action.nextActions) {
        previousActionMap.set(nextAction.action.toString(), { id: action.id, condition: nextAction.condition })
      }

      // don't fork the same action twice (can happen with workflows with loops)
      if (idsMap.has(action.id)) {
        continue
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
      menuMap = await this.forkMenu(user, integrationForAction, action, menuMap)
      const forkedAction = await this.workflowActionService.createOne({
        owner: user._id,
        workflow: forkedWorkflow._id,
        isRootAction: action.isRootAction,
        isContractRootAction: action.isContractRootAction,
        integrationAction: action.integrationAction,
        name: action.name,
        inputs: {
          ...templateInputs,
          ...fixObjectTypes(
            replaceTemplateFields(idsMap, action.inputs ?? {}, templateInputs, menuMap),
            workflow.templateSchema ?? {},
          ),
          // replace order menu
          ...(integrationForAction.key === 'orders' && action.inputs.menu && menuMap.has(action.inputs.menu)
            ? { menu: menuMap.get(action.inputs.menu) }
            : {}),
        },
        previousAction: idsMap.get(previousAction?.id ?? '') as any,
        nextActions: action.nextActions
          .map((nextAction) => ({
            ...nextAction,
            action: idsMap.get(nextAction.action.toString()),
          }))
          .filter((nextAction) => !!nextAction.action) as any,
        previousActionCondition: previousAction?.condition,
        credentials: credentialsForAction?.id,
        schemaResponse: isOwner ? action.schemaResponse : undefined,
        type: action.type,
        isPublic,
      })
      idsMap.set(action.id, forkedAction.id)
    }

    // this suppors the case of an action referencing a future action with go to
    for (const action of sortedActions) {
      const forkedId = idsMap.get(action.id)
      const forkedAction = await this.workflowActionService.findById(forkedId!)
      if (action.nextActions.length !== forkedAction!.nextActions.length) {
        await this.workflowActionService.updateOneNative(
          {
            _id: new ObjectId(forkedId!),
          },
          {
            $set: {
              nextActions: action.nextActions.map((nextAction) => ({
                condition: nextAction.condition,
                action: idsMap.get(nextAction.action.toString()),
              })),
            },
          },
        )
      }
    }

    return forkedWorkflow
  }

  async forkMenu(
    user: User,
    integration: Integration,
    workflowAction: WorkflowAction,
    menuMap: Map<string, string> = new Map(),
  ) {
    // don't need to fork the menu if the chatbot is copied in the same account
    if (workflowAction.owner.toString() === user._id.toString()) {
      return menuMap
    }

    if (!workflowAction?.inputs) {
      return menuMap
    }
    const menuKeys = findOutputKeys(workflowAction.inputs, 'menu')
    if (integration.key === 'orders' && workflowAction.inputs.menu) {
      menuKeys.push(workflowAction.inputs.menu)
    }

    for (const key of menuKeys) {
      if (!menuMap.has(key)) {
        const originalMenu = await this.menuService.findOne({
          _id: new ObjectId(key),
          owner: workflowAction.owner._id,
        })
        if (!originalMenu) {
          throw new NotFoundException(`This chatbot uses the menu ${key} which was deleted by the original owner.`)
        }
        const userMenus = await this.menuService.find({ owner: user._id })
        const useMenu = userMenus.find((menu) => menu.name === originalMenu.name)
        let menuId: string | undefined = useMenu?.id
        if (!useMenu) {
          const newMenu = await this.menuService.createOne({
            owner: user._id,
            name: originalMenu.name,
            currency: originalMenu.currency,
            items: originalMenu.items,
          })
          menuId = newMenu.id
        }
        menuMap.set(key, menuId!)
      }
    }
    return menuMap
  }

  async updateUsedIntegrations(workflow: Workflow) {
    const integrationIds = new Set<string>()
    const trigger = await this.workflowTriggerService.findOne({ workflow: workflow.id })
    if (trigger) {
      const integrationTrigger = await this.integrationTriggerSerice.findById(trigger.integrationTrigger.toString())
      if (integrationTrigger) {
        integrationIds.add(integrationTrigger.integration.toString())
      }
    }
    const actions = await this.workflowActionService.find({ workflow: workflow.id })
    for (const action of actions) {
      const integrationAction = await this.integrationActionService.findById(action.integrationAction.toString())
      if (integrationAction) {
        integrationIds.add(integrationAction.integration.toString())
      }
    }
    await this.updateById(workflow._id, { usedIntegrations: Array.from(integrationIds) })
  }
}
