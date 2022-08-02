import { BaseEntity } from '@app/common/base/base-entity'
import { Injectable, Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { prop, ReturnModelType } from '@typegoose/typegoose'
import { InjectModel, TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection, TestDatabaseModule } from '../../test/database/test-database.module'
import { BaseService } from './base.service'

class TestEntity extends BaseEntity {
  @prop({ required: true, text: true })
  name: string

  @prop()
  num?: number
}

describe('BaseService', () => {
  let service: BaseService<TestEntity>
  let model: ReturnModelType<typeof TestEntity>

  // Since base service is abstract, we need to extend it for tests
  @Injectable()
  class TestService extends BaseService<TestEntity> {
    protected readonly logger: Logger

    constructor(@InjectModel(TestEntity) protected readonly model: ReturnModelType<typeof TestEntity>) {
      super(model)
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([TestEntity]), TestDatabaseModule],
      providers: [TestService],
    }).compile()

    service = module.get<TestService>(TestService)
    model = service.Model
    await model.collection.createIndex({ name: 'text' })
  })

  afterEach(async () => await model.db.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('FindOne', () => {
    it('should return an item by id', async () => {
      await model.create({ name: 'test', num: 1 } as any)
      expect(await service.findOne({ name: 'test' })).toMatchObject({ name: 'test', num: 1 })
    })

    it('should return null if item does not exist', async () => {
      expect(await service.findOne({ name: 'test' })).toBeNull()
    })
  })

  describe('Query', () => {
    it('should return multiple items', async () => {
      await model.create({ name: 'test-1', num: 1 } as any)
      await model.create({ name: 'test-2', num: 2 } as any)
      await model.create({ name: 'test-3', num: 3 } as any)
      const result = await service.query({})
      expect(result).toHaveLength(3)
      expect(result).toMatchObject([
        { name: 'test-1', num: 1 },
        { name: 'test-2', num: 2 },
        { name: 'test-3', num: 3 },
      ])
    })

    it('should support searches', async () => {
      await model.create({ name: 'foo 1' } as any)
      await model.create({ name: 'foo 2' } as any)
      await model.create({ name: 'bar 1' } as any)
      await model.create({ name: 'bar 2' } as any)
      const query = { search: 'foo' }
      const result = await service.query(query as any)
      expect(result).toHaveLength(2)
      expect(result).toMatchObject([{ name: 'foo 1' }, { name: 'foo 2' }])
    })
  })

  describe('findByIds', () => {
    it('should find multiple items by id', async () => {
      const doc1 = await model.create({ name: 'foo 1' } as any)
      const doc2 = await model.create({ name: 'foo 2' } as any)
      const doc3 = await model.create({ name: 'foo 3' } as any)
      const result = await service.findByIds([doc1._id, doc2._id, doc3._id])
      expect(result).toHaveLength(3)
      expect(result[0]._id).toEqual(doc1._id)
      expect(result[1]._id).toEqual(doc2._id)
      expect(result[2]._id).toEqual(doc3._id)
    })
  })

  describe('CreateOne', () => {
    it('should crete an item', async () => {
      await service.createOne({ name: 'test-1', num: 1 })
      expect(await model.findOne({ name: 'test-1' })).toMatchObject({ name: 'test-1', num: 1 })
    })

    it('should fail if name is not provided', async () => {
      await expect(() => service.createOne({ num: 1 })).rejects.toThrow(/Path `name` is required/)
    })
  })
})
