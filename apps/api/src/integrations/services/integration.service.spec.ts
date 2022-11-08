import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { Integration } from '../entities/integration'
import { IntegrationService } from './integration.service'

describe('IntegrationService', () => {
  let service: IntegrationService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([Integration]), MockModule],
      providers: [IntegrationService],
    }).compile()

    service = testModule.get<IntegrationService>(IntegrationService)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createOrUpdateOne', () => {
    it('should create a document if does not exist', async () => {
      const record = {
        name: 'Test 1',
        key: 'test-1',
        version: '1',
        deprecated: false,
      }
      await service.createOrUpdateOne(record)
      const doc = await service.findOne({ key: 'test-1', version: '1' })
      expect(doc).toMatchObject(record)
    })

    it('should update a document if already exists', async () => {
      const record = {
        name: 'Test 1',
        key: 'test-1',
        version: '1',
        deprecated: false,
      }
      await service.createOrUpdateOne(record)
      await service.createOrUpdateOne({ ...record, name: 'UPDATED' })
      expect(await service.find({ key: 'test-1', version: '1' })).toHaveLength(1)
      const doc = await service.findOne({ key: 'test-1', version: '1' })
      expect(doc?.name).toEqual('UPDATED')
    })
  })
})
