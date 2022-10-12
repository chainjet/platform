import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { WorkflowUsedId } from '../entities/workflow-used-id'

@Injectable()
export class WorkflowUsedIdService extends BaseService<WorkflowUsedId> {
  protected readonly logger = new Logger(WorkflowUsedIdService.name)

  constructor(@InjectModel(WorkflowUsedId) protected readonly model: ReturnModelType<typeof WorkflowUsedId>) {
    super(model)
  }
}
