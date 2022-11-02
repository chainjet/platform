import { BaseService } from '@app/common/base/base.service'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import { InjectModel } from 'nestjs-typegoose'
import { UserService } from '../../users/services/user.service'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../entities/workflow'

@Injectable()
export class WorkflowService extends BaseService<Workflow> {
  protected readonly logger = new Logger(WorkflowService.name)
  static instance: WorkflowService

  constructor(
    @InjectModel(Workflow) protected readonly model: ReturnModelType<typeof Workflow>,
    protected workflowTriggerService: WorkflowTriggerService,
    protected workflowActionService: WorkflowActionService,
    protected userService: UserService,
  ) {
    super(model)
    WorkflowService.instance = this
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
}
