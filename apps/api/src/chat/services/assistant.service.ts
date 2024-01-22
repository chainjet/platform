import { BaseService } from '@app/common/base/base.service'
import { assertNever } from '@app/common/utils/typescript.utils'
import { InjectQueue } from '@nestjs/bull'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DeleteOneOptions, UpdateOneOptions } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { camelCase } from 'lodash'
import { UpdateResult } from 'mongodb'
import { FilterQuery, UpdateQuery } from 'mongoose'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { Assistant } from '../entities/assistant'
import { AssistantSkill, AssistantSkillKey } from '../entities/assistant-skill'

@Injectable()
export class AssistantService extends BaseService<Assistant> {
  protected readonly logger = new Logger(AssistantService.name)
  static instance: AssistantService

  constructor(
    @InjectModel(Assistant) protected readonly model: ReturnModelType<typeof Assistant>,
    @InjectQueue('assistants') private assistantsQueue: Queue,
    private userService: UserService,
  ) {
    super(model)
    AssistantService.instance = this
  }

  async createOne(record: Partial<Assistant>): Promise<Assistant> {
    if (!record.owner) {
      throw new BadRequestException()
    }
    const user = await this.userService.findById(record.owner.toString())
    if (!user) {
      throw new BadRequestException()
    }

    if (record.enabled) {
      const existing = await this.findOne({ owner: record.owner, enabled: true })
      if (existing) {
        throw new Error('You can only have one enabled assistant at a time')
      }
    }

    this.validateSkills(record.skills || [], user)

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
    const assistant = await this.findById(id)
    if (!assistant) {
      throw new NotFoundException(`Assistant not found: ${id}`)
    }
    const user = await this.userService.findOne({ _id: assistant.owner })
    if (!user) {
      throw new BadRequestException()
    }

    if (update.enabled) {
      const existing = await this.findOne({ _id: { $ne: id }, owner: user._id, enabled: true })
      if (existing) {
        throw new Error('You can only have one enabled assistant at a time')
      }
    }

    if (update.skills?.length) {
      this.validateSkills(update.skills, user)
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

  private validateSkills(skills: AssistantSkill[], user: User) {
    if (skills?.length && !user.planConfig.assistantSkills) {
      throw new BadRequestException('Please upgrade your plan to use chatbot skills')
    }
    for (const skill of skills) {
      switch (skill.key) {
        case AssistantSkillKey.api:
          for (const requiredKey of ['name', 'url', 'method', 'contentType']) {
            if (!skill.inputs?.[requiredKey]) {
              throw new Error(`${requiredKey} is required for API skill`)
            }
          }
          skill.inputs['key'] = camelCase(skill.inputs['name'])
          break
        case AssistantSkillKey.tags:
          if (skills.filter((s) => s.key === AssistantSkillKey.tags).length > 1) {
            throw new Error(`You can only have one Tags skill`)
          }
          if (!Array.isArray(skill.inputs?.['tags']) || !skill.inputs['tags'].length) {
            throw new Error(`tags is required for the Tags skill`)
          }
          for (const tag of skill.inputs['tags']) {
            if (!tag.name || !tag.description) {
              throw new Error(`name and description are required for every tag`)
            }
          }
          break
        default:
          assertNever(skill.key)
          throw new Error(`Invalid skill key: ${skill.key}`)
      }
    }
  }
}
