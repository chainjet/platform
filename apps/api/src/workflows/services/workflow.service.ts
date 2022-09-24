import { BaseService } from '@app/common/base/base.service'
import { SecurityUtils } from '@app/common/utils/security.utils'
import { slugify } from '@app/common/utils/string.utils'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Workflow } from '../entities/workflow'

@Injectable()
export class WorkflowService extends BaseService<Workflow> {
  protected readonly logger = new Logger(WorkflowService.name)

  constructor(@InjectModel(Workflow) protected readonly model: ReturnModelType<typeof Workflow>) {
    super(model)
  }

  async createOne(record: DeepPartial<Workflow>): Promise<Workflow> {
    if (!record.owner || !record.name) {
      throw new BadRequestException()
    }

    // set workflow slug
    record.slug = `main/workflow/${slugify(record.name)}`

    const slugExists = await this.model.exists({ slug: record.slug })
    if (slugExists) {
      record.slug += `-${SecurityUtils.generateRandomString(6)}`
    }

    return await super.createOne(record)
  }

  async updateOne(id: string, record: DeepPartial<Workflow>, opts?: UpdateOneOptions<Workflow>): Promise<Workflow> {
    const workflow = await this.findById(id, opts)

    if (!workflow) {
      throw new NotFoundException()
    }

    if (record.name && record.name !== workflow.name) {
      record.slug = `${workflow.slug.split('/').slice(0, -1).join('/')}/${slugify(record.name)}`
    }

    if (record.runOnFailure?.toString() === workflow.id) {
      throw new BadRequestException('Run On Failure cannot be set with the same workflow ID.')
    }

    return await super.updateOne(id, record, opts)
  }

  // TODO delete workflow trigger and actions. We could use a queue to avoid circular dependency
  //      and to remove everything on the background.
  async deleteOne(id: string, opts?: DeleteOneOptions<Workflow>): Promise<Workflow> {
    return await super.deleteOne(id, opts)
  }
}
