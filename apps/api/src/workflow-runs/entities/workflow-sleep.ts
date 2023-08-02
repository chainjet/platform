import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { jsonProp } from '../../../../../libs/common/src/decorators/props/json-prop.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { Workflow } from '../../workflows/entities/workflow'
import { WorkflowRun } from './workflow-run'

export class WorkflowSleep extends BaseEntity {
  @prop({ ref: WorkflowRun, required: true })
  workflowRun: Reference<WorkflowRun>

  @prop({ ref: Workflow, required: true, index: true })
  workflow: Reference<Workflow>

  @prop({ ref: WorkflowAction, required: true })
  workflowAction: Reference<WorkflowAction>

  @prop({ required: false, index: true })
  sleepUntil?: Date

  @jsonProp()
  nextActionInputs: Record<string, unknown>

  /**
   * ID of the trigger item that started this action
   */
  @prop({ required: true })
  itemId: string | number

  @prop()
  uniqueGroup?: string
}
