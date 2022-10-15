import { BadRequestException, Injectable } from '@nestjs/common'
import { Types } from 'mongoose'
import { WorkflowActionService } from '../../workflow-actions/services/workflow-action.service'
import { WorkflowTriggerService } from '../../workflow-triggers/services/workflow-trigger.service'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowService } from '../../workflows/services/workflow.service'

@Injectable()
export class TemplateService {
  static instance: TemplateService

  constructor(
    private workflowService: WorkflowService,
    private workflowTriggerService: WorkflowTriggerService,
    private workflowActionService: WorkflowActionService,
  ) {
    TemplateService.instance = this
  }

  async createFromTemplate({
    userId,
    template,
    name,
    inputs,
  }: {
    userId: Types.ObjectId
    template: Workflow
    name?: string
    inputs: Record<string, any>
  }): Promise<Workflow> {
    if (userId.toString() !== template.owner.toString()) {
      throw new BadRequestException('You can only create workflows from your own templates.')
    }
    const workflow = await this.workflowService.createOne({
      owner: userId,
      name: name ?? `New ${template.name}`,
    })

    const trigger = await this.workflowTriggerService.findOne({ workflow: template.id })
    const idsMap = new Map<string, string>()

    if (trigger) {
      const newTrigger = await this.workflowTriggerService.createOne({
        ...trigger,
        _id: undefined,
        owner: userId,
        workflow: workflow._id,
        lastId: undefined,
        nextCheck: undefined,
        enabled: true,
        inputs: this.replaceTemplateFields(idsMap, trigger.inputs ?? {}, inputs ?? {}),
      })
      idsMap.set(trigger.id, newTrigger.id)
    }

    const actions = await this.workflowActionService.find({ workflow: template.id })
    for (const action of actions) {
      const newAction = await this.workflowActionService.createOne({
        ...action.toObject(),
        _id: undefined,
        owner: userId,
        workflow: workflow._id,
        inputs: this.replaceTemplateFields(idsMap, action.inputs ?? {}, inputs ?? {}),
      })
      idsMap.set(action.id, newAction.id)
    }

    return workflow
  }

  /**
   * Replace template fields recursively.
   */
  replaceTemplateFields(
    idsMap: Map<string, string>,
    inputs: Record<string, any>,
    templateInputs: Record<string, any>,
  ): Record<string, any> {
    const result = {}
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'object') {
        result[key] = this.replaceTemplateFields(idsMap, value, templateInputs)
      } else if (typeof value === 'string') {
        let newValue = value
        const matches = value.matchAll(/{{\s*([^}]+)\s*}}/g)
        for (const match of matches) {
          if (match[1].trim().startsWith('template.')) {
            newValue = newValue.replace(match[0], templateInputs[match[1].trim().replace('template.', '')])
          } else {
            // replace interpolated ids
            const oldId = match[1].split('.')[0].trim()
            const newId = idsMap.get(oldId)
            if (newId) {
              newValue = newValue.replace(oldId, newId)
            }
          }
        }
        result[key] = newValue
      } else {
        result[key] = value
      }
    }
    return result
  }
}
