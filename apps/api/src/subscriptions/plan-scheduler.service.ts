import { addOneMonth } from '@app/common/utils/date.utils'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { UserService } from 'apps/api/src/users/services/user.service'
import { plansConfig } from '../users/config/plans.config'
import { User } from '../users/entities/user'
import { WorkflowTriggerService } from '../workflow-triggers/services/workflow-trigger.service'

@Injectable()
export class PlanSchedulerService {
  private readonly logger = new Logger(PlanSchedulerService.name)

  constructor(
    private readonly userService: UserService,
    private readonly workflowTriggerSerive: WorkflowTriggerService,
  ) {}

  @Interval(1000 * 60 * 10)
  async scheduleResetOperations(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      await this.resetUserOperations()
    }
  }

  async resetUserOperations(): Promise<void> {
    const users = await this.userService.find({
      operationsReset: { $lt: new Date() },
    })
    this.logger.log(`Found ${users.length} users to reset operations`)
    for (const user of users) {
      await this.resetOperationsForUser(user)
    }
  }

  async resetOperationsForUser(user: User): Promise<void> {
    await this.userService.updateOneNative(
      { _id: user._id },
      {
        operationsUsedMonth: 0,
        operationsReset: addOneMonth(user.operationsReset),
        ...(user.nextPlan ? { plan: user.nextPlan } : {}),
        $unset: { nextPlan: '' },
      },
    )
    if (user.nextPlan && user.plan !== user.nextPlan) {
      await this.workflowTriggerSerive.updateFeaturesOnPlanChange(user._id, plansConfig[user.nextPlan])
    }
    await this.workflowTriggerSerive.unmarkUserPlanAsLimited(user._id)
    this.logger.log(`Reset operations for user ${user._id}`)
  }
}
