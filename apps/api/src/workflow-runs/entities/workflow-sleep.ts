import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { jsonProp } from '../../../../../libs/common/src/decorators/props/json-prop.decorator'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { WorkflowAction } from '../../workflow-actions/entities/workflow-action'
import { WorkflowRun } from './workflow-run'

export class WorkflowSleep extends BaseEntity {
  @prop({ ref: WorkflowRun, required: true })
  workflowRun: Reference<WorkflowRun>

  @prop({ ref: WorkflowAction, required: true })
  workflowAction: Reference<WorkflowAction>

  @prop({ required: true, index: true })
  sleepUntil: Date

  @jsonProp()
  nextActionInputs: Record<string, unknown>
}
