import { BaseEntity } from '@app/common/base/base-entity'
import { TypegooseQueryService } from '@app/common/TypegooseQueryService'
import { Injectable, Logger } from '@nestjs/common'
import {
  DeepPartial,
  Filter,
  FindByIdOptions,
  Query,
  UpdateManyResponse,
  UpdateOneOptions,
} from '@ptc-org/nestjs-query-core'
import { mongoose, ReturnModelType } from '@typegoose/typegoose'
import { Cache } from 'cache-manager'
import { ObjectId, UpdateResult } from 'mongodb'
import {
  AggregateOptions,
  FilterQuery,
  HydratedDocument,
  PipelineStage,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose'

@Injectable()
export abstract class BaseService<T extends BaseEntity> extends TypegooseQueryService<T> {
  protected abstract readonly logger: Logger
  protected cacheManager: Cache

  // cache is only enabled when cacheKey is set
  protected cacheKey: string | null = null

  constructor(protected readonly model: ReturnModelType<new () => T>) {
    super(model, { documentToObjectOptions: { virtuals: true, getters: true } })
  }

  /**
   * Returns whether an entity can be created or updated.
   * At integration level authentication has already been handled and owner ID can be trusted.
   * CRUD authorization has also been handled by the resolver.
   * This method is responsible to check whether references are allowed.
   */
  // abstract canCreateOrUpdate (record: DeepPartial<T>): Promise<boolean> | boolean

  async query(query: Query<T>): Promise<T[]> {
    // if a search was given, include it on the filter
    const search = (query as any).search as string
    if (search) {
      return await this.searchQuery(query as any)
    }

    // support sorting by createdAt (sort by _id on mongo)
    if (query.sorting?.length) {
      query.sorting = query.sorting.map((sort) => ({
        ...sort,
        field: sort.field === 'createdAt' ? '_id' : sort.field,
      }))
    }

    return await super.query(query)
  }

  /**
   * Run text search using MongoDB's text index
   * see https://docs.mongodb.com/manual/text-search/
   */
  protected async searchQuery(query: Query<T> & { search: string }): Promise<T[]> {
    const filter: FilterQuery<new () => T> = {
      ...this.buildExpression(query.filter ?? {}),
      $text: { $search: query.search },
    }
    const projection = {
      score: { $meta: 'textScore' },
    }
    const options = {
      limit: query.paging?.limit,
      skip: query.paging?.offset,
      sort: {
        score: { $meta: 'textScore' },
      },
    }
    const docs = await this.Model.find(filter, projection, options).exec()
    return docs.map((doc) => doc.toObject(this.documentToObjectOptions) as T)
  }

  find(
    conditions: FilterQuery<new () => T>,
    projection?: any | null,
    options?: QueryOptions,
  ): Promise<HydratedDocument<T>[]> {
    return this.model.find(conditions, projection, options).exec()
  }

  async findOne(
    conditions?: FilterQuery<new () => T>,
    projection?: ProjectionType<T> | null,
    options?: QueryOptions<T> | null,
  ): Promise<T | null> {
    if (!conditions) {
      return null
    }
    return (
      (await this.model.findOne(conditions, projection, options).exec())?.toObject(this.documentToObjectOptions) ?? null
    )
  }

  async findById(id: string, opts?: FindByIdOptions<T> | undefined): Promise<T | undefined> {
    if (!this.cacheKey || opts) {
      return super.findById(id, opts)
    }
    const cacheKey = `${this.cacheKey}:${id}`
    const cachedResult = await this.cacheManager.get<T>(cacheKey)
    if (cachedResult) {
      return this.hydrate(cachedResult)
    } else {
      const result = await super.findById(id)
      if (result) {
        await this.cacheManager.set(cacheKey, result)
      }
      return result
    }
  }

  async findByIds(ids: mongoose.Types.ObjectId[], projection?: any | null, options?: QueryOptions): Promise<T[]> {
    const conditions = {
      _id: { $in: ids },
    } as FilterQuery<new () => T>
    const items = await this.model.find(conditions, projection, options)
    return items.map((item) => item.toObject(this.documentToObjectOptions))
  }

  async createOrUpdateOne(query: FilterQuery<new () => T>, record: DeepPartial<T>): Promise<T> {
    const existentDocument = await this.findOne(query)
    if (existentDocument) {
      const res = await this.updateOne(existentDocument.id, record)
      this.logger.debug(`Updated ${this.model.modelName}: ${JSON.stringify(query)}`)
      return res
    } else {
      const res = await this.createOne(record)
      this.logger.debug(`Created ${this.model.modelName}: ${JSON.stringify(query)}`)
      return res
    }
  }

  createOne(record: DeepPartial<T>): Promise<T> {
    return super.createOne(record)
  }

  createMany(records: Array<DeepPartial<T>>): Promise<T[]> {
    return super.createMany(records)
  }

  updateOne(id: string, update: DeepPartial<T>, opts?: UpdateOneOptions<T>): Promise<T> {
    return super.updateOne(id, update, opts)
  }

  updateMany(update: DeepPartial<T>, filter: Filter<T>): Promise<UpdateManyResponse> {
    return super.updateMany(update, filter)
  }

  update(conditions: FilterQuery<new () => T>, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    return this.model.updateMany(conditions, query).exec()
  }

  updateById(id: ObjectId, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    const conditions: FilterQuery<new () => T> = { _id: id }
    return this.model.updateOne(conditions, query).exec()
  }

  updateOneNative(conditions: FilterQuery<new () => T>, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    if (Number.isFinite(conditions.__v) && !Number.isFinite(query.__v)) {
      query.__v = conditions.__v + 1
    }
    return this.model.updateOne(conditions, query).exec()
  }

  updateManyNative(conditions: FilterQuery<new () => T>, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    return this.model.updateMany(conditions, query).exec()
  }

  async deleteOneNative(conditions: FilterQuery<new () => T>): Promise<void> {
    await this.model.deleteOne(conditions).exec()
  }

  async deleteManyNative(conditions: FilterQuery<new () => T>): Promise<void> {
    await this.model.deleteMany(conditions).exec()
  }

  aggregateNative(pipeline?: PipelineStage[], options?: AggregateOptions) {
    return this.model.aggregate(pipeline).exec()
  }

  findByIdAndUpdate(
    id: mongoose.Types.ObjectId,
    query: UpdateQuery<new () => T>,
    options: QueryOptions = {},
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, query, options).exec()
  }

  countNative(conditions: FilterQuery<new () => T>): Promise<number> {
    return this.model.countDocuments(conditions).exec()
  }

  hydrate(doc: any): T {
    const res = this.model.hydrate(doc)
    if (res?.createdAt) {
      res.createdAt = new Date(res.createdAt)
    }
    return res
  }
}
