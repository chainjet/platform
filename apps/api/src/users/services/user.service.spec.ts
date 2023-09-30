import { CommonModule } from '@app/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { closeMongoConnection, TestDatabaseModule } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { User } from '../entities/user'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([User]), MockModule, CommonModule],
      providers: [UserService],
    }).compile()

    service = testModule.get<UserService>(UserService)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  beforeEach(() => {
    SecurityUtils.hashWithBcrypt = jest.fn((str: string) => Promise.resolve(`hashed(${str})`))
    SecurityUtils.bcryptHashIsValid = jest.fn((value: string, hash: string) =>
      Promise.resolve(hash === `hashed(${value})`),
    )
    SecurityUtils.generateRandomString = jest.fn((chars: number) => `generated:${chars}`)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('incrementOperationsUsed', () => {
    it('should increment total and month operations used', async () => {
      const user = await mock.createUser()
      expect(user.operationsUsedTotal).toBe(0)
      expect(user.operationsUsedMonth).toBe(0)
      await service.incrementOperationsUsed(user._id, true)
      const updatedUser = await service.findById(user.id)
      expect(updatedUser?.operationsUsedTotal).toBe(1)
      expect(updatedUser?.operationsUsedMonth).toBe(1)
    })
  })
})
