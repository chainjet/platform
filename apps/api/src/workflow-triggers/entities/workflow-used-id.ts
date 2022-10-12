import { BaseEntity } from '@app/common/base/base-entity'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { index, prop } from '@typegoose/typegoose'
import { Workflow } from '../../workflows/entities/workflow'

@index({ workflow: 1, triggerId: 1 }, { unique: true })
@EntityRef('workflow', () => Workflow)
export class WorkflowUsedId extends BaseEntity {
  @prop({ ref: Workflow, required: true, index: true })
  workflow: Reference<Workflow>

  @prop({ required: true })
  triggerId: string
}
