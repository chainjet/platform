import { BaseService } from '@app/common/base/base.service'
import { slugify } from '@app/common/utils/string.utils'
import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeepPartial, DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { UserService } from '../../users/services/user.service'
import { WorkflowService } from '../../workflows/services/workflow.service'
import { Project } from '../entities/project'

@Injectable()
export class ProjectService extends BaseService<Project> {
  protected readonly logger = new Logger(ProjectService.name)

  constructor(
    @InjectModel(Project) protected readonly model: ReturnModelType<typeof Project>,
    protected userService: UserService,
    @Inject(forwardRef(() => WorkflowService)) protected workflowService: WorkflowService,
  ) {
    super(model)
  }

  async createOne(record: DeepPartial<Project>): Promise<Project> {
    if (!record.owner) {
      throw new NotFoundException()
    }

    const user = await this.userService.findById(record.owner.toString())
    if (!user) {
      throw new NotFoundException()
    }

    if (!record.name) {
      throw new BadRequestException('Name is required')
    }

    // set project slug
    record.slug = `${user.username.toLowerCase()}/${slugify(record.name)}`

    return await super.createOne(record)
  }

  async updateOne(id: string, record: DeepPartial<Project>, opts?: UpdateOneOptions<Project>): Promise<Project> {
    const project = await this.findById(id, opts)
    if (!project) {
      throw new NotFoundException()
    }

    // if project name is updated, update slug on project and workflows
    if (record.name && record.name !== project.name) {
      record.slug = `${project.slug.split('/')[0]}/${slugify(record.name)}`
      if (record.slug !== project.slug) {
        const workflows = await this.workflowService.find({ project: project._id })
        for (const workflow of workflows) {
          const workflowSlug = record.slug + '/' + workflow.slug.split('/').slice(2).join('/')
          await this.workflowService.updateOne(workflow.id, { slug: workflowSlug })
        }
      }
    }

    return await super.updateOne(id, record, opts)
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<Project>): Promise<Project> {
    const workflows = await this.workflowService.find({ project: id })

    // TODO this could trigger large cascade effect. We should delete on background using a queue.
    // Delete all workflows belonging to the project
    for (const workflow of workflows) {
      await this.workflowService.deleteOne(workflow.id, opts)
    }

    return await super.deleteOne(id, opts)
  }
}
