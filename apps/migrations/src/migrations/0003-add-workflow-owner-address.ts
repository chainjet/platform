import { Injectable } from '@nestjs/common'
import { UserService } from 'apps/api/src/users/services/user.service'
import { WorkflowService } from 'apps/api/src/workflows/services/workflow.service'

@Injectable()
export class Migration0003 {
  constructor(private workflowService: WorkflowService, private userService: UserService) {}

  async run() {
    const workflows = await this.workflowService.find({})
    console.log(`There are ${workflows.length} workflows`)
    for (const workflow of workflows) {
      const user = await this.userService.findById(workflow.owner.toString())
      if (!user) {
        throw new Error(`User ${workflow.owner} not found`)
      }
      workflow.ownerAddress = user.address
      await this.workflowService.updateOne(workflow.id.toString(), workflow)
    }
    console.log(`Migration completed`)
  }
}
