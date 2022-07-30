import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { BaseService } from '../../../../../libs/common/src/base/base.service'
import { WorkflowSleep } from '../entities/workflow-sleep'

@Injectable()
export class WorkflowSleepService extends BaseService<WorkflowSleep> {
  protected readonly logger = new Logger(WorkflowSleepService.name)

  constructor (
    @InjectModel(WorkflowSleep) protected readonly model: ReturnModelType<typeof WorkflowSleep>
    // private readonly userService: UserService,
    // private readonly workflowTriggerService: WorkflowTriggerService
  ) {
    super(model)
  }
}
