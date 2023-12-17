import { BaseService } from '@app/common/base/base.service'
import { RedisPubSubService } from '@app/common/cache/redis-pubsub.service'
import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { UpdateResult } from 'mongodb'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { Assistant } from '../entities/assistant'

@Injectable()
export class AssistantService extends BaseService<Assistant> {
  protected readonly logger = new Logger(AssistantService.name)
  static instance: AssistantService

  constructor(
    @InjectModel(Assistant) protected readonly model: ReturnModelType<typeof Assistant>,
    @InjectQueue('assistants') private assistantsQueue: Queue,
    protected redisPubSubService: RedisPubSubService,
  ) {
    super(model)
    AssistantService.instance = this
  }

  async createOne(record: Partial<Assistant>): Promise<Assistant> {
    if (record.enabled) {
      const existing = await this.findOne({ owner: record.owner, enabled: true })
      if (existing) {
        throw new Error('You can only have one enabled assistant at a time')
      }
    }
    const assistant = await super.createOne(record)
    return assistant
  }

  async afterCreateOne(assistant: Assistant) {
    this.assistantsQueue.add({
      type: 'created',
      id: assistant._id,
    })
  }

  async updateOne(
    id: string,
    update: Partial<Assistant>,
    opts?: UpdateOneOptions<Assistant> | undefined,
  ): Promise<Assistant> {
    if (update.enabled) {
      const existing = await this.findOne({ _id: { $ne: id }, enabled: true })
      if (existing) {
        throw new Error('You can only have one enabled assistant at a time')
      }
    }
    this.assistantsQueue.add({
      type: 'updated',
      id,
    })
    return super.updateOne(id, update, opts)
  }

  updateOneNative(
    conditions: FilterQuery<new () => Assistant>,
    query: UpdateQuery<new () => Assistant>,
  ): Promise<UpdateResult> {
    this.assistantsQueue.add({
      type: 'updated',
      id: conditions._id,
    })
    return super.updateOneNative(conditions, query)
  }

  async deleteOne(id: string, opts?: DeleteOneOptions<Assistant> | undefined): Promise<Assistant> {
    const assistant = await this.findById(id)
    if (assistant) {
      this.assistantsQueue.add({
        type: 'deleted',
        id,
        assistantId: assistant.assistantId,
      })
    }
    return super.deleteOne(id, opts)
  }
}
