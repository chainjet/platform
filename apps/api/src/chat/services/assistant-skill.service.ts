import { BaseService } from '@app/common/base/base.service'
import { InjectQueue } from '@nestjs/bull'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { UpdateResult } from 'mongodb'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { AssistantSkill } from '../entities/assistant-skill'
import { AssistantService } from './assistant.service'

@Injectable()
export class AssistantSkillService extends BaseService<AssistantSkill> {
  protected readonly logger = new Logger(AssistantSkillService.name)
  static instance: AssistantSkillService

  constructor(
    @InjectModel(AssistantSkill) protected readonly model: ReturnModelType<typeof AssistantSkill>,
    @InjectQueue('assistants') private assistantsQueue: Queue,
    private assistantService: AssistantService,
  ) {
    super(model)
    AssistantSkillService.instance = this
  }

  async createOne(record: Partial<AssistantSkill>): Promise<AssistantSkill> {
    if (!record.assistant || !record.owner) {
      throw new BadRequestException()
    }

    // Verify assistant exist and the user has access to it
    const assistant = await this.assistantService.findById(record.assistant?.toString())
    if (!assistant?.owner || assistant.owner.toString() !== record.owner.toString()) {
      throw new NotFoundException(`Assistant ${record.assistant} not found`)
    }

    return super.createOne(record)
  }

  async afterCreateOne(assistantSkill: AssistantSkill) {
    this.assistantsQueue.add({
      type: 'skill-created',
      id: assistantSkill._id,
    })
  }

  async updateOne(
    id: string,
    update: Partial<AssistantSkill>,
    opts?: UpdateOneOptions<AssistantSkill> | undefined,
  ): Promise<AssistantSkill> {
    this.assistantsQueue.add({
      type: 'skill-updated',
      id,
    })
    return super.updateOne(id, update, opts)
  }

  updateOneNative(
    conditions: FilterQuery<new () => AssistantSkill>,
    query: UpdateQuery<new () => AssistantSkill>,
  ): Promise<UpdateResult> {
    this.assistantsQueue.add({
      type: 'skill-updated',
      id: conditions._id,
    })
    return super.updateOneNative(conditions, query)
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<AssistantSkill> | undefined): Promise<AssistantSkill> {
    const assistantSkill = await this.findById(id)
    if (assistantSkill) {
      this.assistantsQueue.add({
        type: 'skill-deleted',
        id,
        assistantId: assistantSkill.assistant,
      })
    }
    return super.deleteOne(id, opts)
  }
}
