import { CommonModule } from '@app/common'
import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { User } from '../entities/user'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService
  let emailService: EmailService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([User]), MockModule, CommonModule],
      providers: [UserService],
    }).compile()

    service = testModule.get<UserService>(UserService)
    mock = testModule.get<MockService>(MockService)
    emailService = testModule.get<EmailService>(EmailService)
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

  describe('updateOne', () => {
    beforeEach(() => {
      emailService.sendEmailTemplate = jest.fn(() => Promise.resolve())
    })

    it('should send a verification email if the email is updated', async () => {
      const user = await mock.createUser({
        email: 'test@example.org',
        verified: true,
      })
      await service.updateOne(user.id, { email: 'new-email@example.org' })
      const updated = await service.findById(user.id)
      expect(updated?.email).toBe('new-email@example.org')
      expect(updated?.verified).toBe(false)
      expect(updated?.verificationToken).toBeDefined()
      expect(emailService.sendEmailTemplate).toHaveBeenCalledTimes(1)
    })

    it('should not send a verification email if the email is not updated', async () => {
      const user = await mock.createUser({
        email: 'test@example.org',
        verified: true,
      })
      await service.updateOne(user.id, { email: 'test@example.org' })
      const updated = await service.findById(user.id)
      expect(updated?.email).toBe('test@example.org')
      expect(updated?.verified).toBe(true)
      expect(updated?.verificationToken).not.toBeDefined()
      expect(emailService.sendEmailTemplate).not.toHaveBeenCalled()
    })
  })

  describe('generateAndSaveVerificationToken', () => {
    it('should create a verification token and save it hashed', async () => {
      const user = await mock.createUser()
      const plainVerificationToken = await service.generateAndSaveVerificationToken(user)
      const updated = await service.findById(user.id)
      expect(plainVerificationToken).toEqual('generated:48')
      expect(updated?.verificationToken).toEqual('hashed(generated:48)')
    })
  })
})
