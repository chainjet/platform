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
  InsertManyOptions,
  PipelineStage,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose'

@Injectable()
export abstract class BaseService<T extends BaseEntity> extends TypegooseQueryService<T> {
  protected abstract readonly logger: Logger
  protected cacheManager: Cache

  // redis cache is only enabled when cacheKey is set
  protected cacheKey: string | null = null

  protected enableFullCache = false
  private useFullCache = false
  private docsCache: Map<string, HydratedDocument<T>> = new Map()

  constructor(protected readonly model: ReturnModelType<new () => T>) {
    super(model, { documentToObjectOptions: { virtuals: true, getters: true } })
  }

  async onModuleInit() {
    if (this.enableFullCache) {
      this.logger.log(`Caching all ${this.model.modelName}s`)
      const docs = await this.model.find().exec()
      docs.forEach((doc) => this.docsCache.set(doc.id, doc))
      this.useFullCache = true
      this.logger.log(`Cached ${this.docsCache.size} ${this.model.modelName}s`)
    }
  }

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

    // cache queries for 1 hour if cache is enabled
    // if (this.cacheKey) {
    //   const cacheKey = `${this.cacheKey}:query:${JSON.stringify(query)}`
    //   const cachedResult = await this.cacheManager.get<T[]>(cacheKey)
    //   if (cachedResult) {
    //     return cachedResult.map((item) => this.hydrate(item))
    //   } else {
    //     const result = await super.query(query)
    //     await this.cacheManager.set(cacheKey, result, { ttl: 60 * 60 } as any)
    //     return result
    //   }
    // }

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
    const bypassCache = !!projection || !!options || this.conditionsContainObject(conditions)
    if (this.useFullCache && !bypassCache) {
      const filteredDocs = Array.from(this.docsCache.values()).filter((doc) => {
        for (const [key, value] of Object.entries(conditions)) {
          if (doc[key] !== value) {
            return false
          }
        }
        return true
      })
      return Promise.resolve(filteredDocs)
    }

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
    const bypassCache = !!projection || !!options || this.conditionsContainObject(conditions)
    if (this.useFullCache && !bypassCache) {
      const doc = Array.from(this.docsCache.values()).find((doc) => {
        for (const [key, value] of Object.entries(conditions)) {
          if (value instanceof mongoose.Types.ObjectId) {
            if (!doc[key].equals(value)) {
              return false
            }
          } else if (doc[key] !== value) {
            return false
          }
        }
        return true
      })
      return doc ? (doc.toObject(this.documentToObjectOptions) as T) : null
    }
    return (
      (await this.model.findOne(conditions, projection, options).exec())?.toObject(this.documentToObjectOptions) ?? null
    )
  }

  async findById(id: string, opts?: FindByIdOptions<T> | undefined): Promise<T | undefined> {
    if (this.useFullCache && !opts) {
      const doc = this.docsCache.get(id)
      return doc ? (doc.toObject(this.documentToObjectOptions) as T) : undefined
    }
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

  async createOne(record: DeepPartial<T>): Promise<T> {
    const doc = await super.createOne(record)
    await this.afterCreateOne(doc)
    return doc
  }

  /**
   * @deprecated use insertMany instead
   * createMany just loops over records and calls createOne
   */
  createMany(records: Array<DeepPartial<T>>): Promise<T[]> {
    return super.createMany(records)
  }

  async insertMany(docs: DeepPartial<T>[], options: InsertManyOptions) {
    const items = await this.model.insertMany(docs, options)
    await this.afterCreateMany(items as T[])
    return items
  }

  async afterCreateOne(record: T) {
    // noop
  }

  async afterCreateMany(records: T[]) {
    // noop
  }

  updateOne(id: string, update: DeepPartial<T>, opts?: UpdateOneOptions<T>): Promise<T> {
    return super.updateOne(id, update, opts)
  }

  updateOneNative(conditions: FilterQuery<new () => T>, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    if (Number.isFinite(conditions.__v) && !Number.isFinite(query.__v)) {
      query.__v = conditions.__v + 1
    }
    return this.model.updateOne(conditions, query).exec()
  }

  updateById(id: ObjectId, query: UpdateQuery<new () => T>): Promise<UpdateResult> {
    const conditions: FilterQuery<new () => T> = { _id: id }
    return this.updateOneNative(conditions, query)
  }

  updateMany(update: DeepPartial<T>, filter: Filter<T>): Promise<UpdateManyResponse> {
    return super.updateMany(update, filter)
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

  async countNative(conditions: FilterQuery<new () => T>): Promise<number> {
    const bypassCache = this.conditionsContainObject(conditions)
    if (this.useFullCache && !bypassCache) {
      const docs = await this.find(conditions)
      return docs.length
    }
    return this.model.countDocuments(conditions).exec()
  }

  hydrate(doc: any): T {
    const res = this.model.hydrate(doc)
    const item = {
      ...res.toObject(this.documentToObjectOptions),
    }
    if (res?.createdAt) {
      item.createdAt = new Date(res.createdAt)
    }
    return item as T
  }

  private conditionsContainObject(conditions: FilterQuery<new () => T>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId)) {
        return true
      }
    }
    return false
  }
}
