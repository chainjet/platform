import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { User } from '../entities/user'
import { UserProvider } from '../entities/user-provider'
import { UserProviderService } from './user-provider.service'
import { UserService } from './user.service'

describe('UserService', () => {
  let service: UserService
  let emailService: EmailService
  let mock: MockService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypegooseModule.forFeature([User, UserProvider]),
        MockModule
      ],
      providers: [UserService, UserProviderService]
    }).compile()

    service = module.get<UserService>(UserService)
    mock = module.get<MockService>(MockService)
    emailService = module.get<EmailService>(EmailService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  beforeEach(() => {
    SecurityUtils.hashWithBcrypt = jest.fn((str: string) => Promise.resolve(`hashed(${str})`))
    SecurityUtils.bcryptHashIsValid = jest.fn((value: string, hash: string) => Promise.resolve(hash === `hashed(${value})`))
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
      await service.incrementOperationsUsed(user._id)
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
        verified: true
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
        verified: true
      })
      await service.updateOne(user.id, { email: 'test@example.org' })
      const updated = await service.findById(user.id)
      expect(updated?.email).toBe('test@example.org')
      expect(updated?.verified).toBe(true)
      expect(updated?.verificationToken).not.toBeDefined()
      expect(emailService.sendEmailTemplate).not.toHaveBeenCalled()
    })
  })

  describe('passwordIsValid', () => {
    it('should return whether the password is valid or not', async () => {
      const user = await mock.createUser({
        email: 'test@example.org',
        password: 'hashed(password)'
      })
      expect(await service.passwordIsValid(user, 'password')).toEqual(true)
      expect(await service.passwordIsValid(user, 'wrong-password')).toEqual(false)
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

  describe('createOrUpdateAccountFromLoginProvider', () => {
    it('should create a new user provider document and generate a completeAuthCode', async () => {
      const user = await mock.createUser()
      const res = await service.createOrUpdateAccountFromLoginProvider(
        user,
        'google',
        {
          provider: 'google',
          displayName: 'Test User',
          id: '123'
        },
        {
          value: 'test@example.com',
          verified: true
        }
      )
      const userProvider = await mock.userProviderService.findById(res.userProviderId)
      expect(userProvider?.completeAuthCode).toBe('generated:48')
      expect(userProvider?.provider).toBe('google')
      expect(userProvider?.profileId).toBe('123')
      expect(userProvider?.displayName).toBe('Test User')
      expect(userProvider?.primaryEmail).toBe('test@example.com')
      expect(userProvider?.user).toEqual(user._id)
      expect(res.userProviderId).toEqual(userProvider?.id)
      expect(res.completeAuthCode).toBe('generated:48')
    })

    it('should create an user provider without user reference', async () => {
      const res = await service.createOrUpdateAccountFromLoginProvider(
        null,
        'google',
        {
          provider: 'google',
          displayName: 'Test User',
          id: '123'
        },
        {
          value: 'test@example.com',
          verified: true
        }
      )
      const userProvider = await mock.userProviderService.findById(res.userProviderId)
      expect(userProvider?.completeAuthCode).toBe('generated:48')
      expect(userProvider?.provider).toBe('google')
      expect(userProvider?.profileId).toBe('123')
      expect(userProvider?.displayName).toBe('Test User')
      expect(userProvider?.primaryEmail).toBe('test@example.com')
      expect(userProvider?.user).toBeUndefined()
      expect(res.userProviderId).toEqual(userProvider?.id)
      expect(res.completeAuthCode).toBe('generated:48')
    })

    it('should update an existent user provider and generate a completeAuthCode', async () => {
      const user = await mock.createUser()
      const originalUserProvider = await mock.createUserProvider()
      const res = await service.createOrUpdateAccountFromLoginProvider(
        user,
        'google',
        {
          provider: 'google',
          displayName: 'Test User',
          id: '123'
        },
        {
          value: 'test@example.com',
          verified: true
        }
      )
      const userProvider = await mock.userProviderService.findById(res.userProviderId)
      expect(userProvider?.id).toBe(originalUserProvider.id)
      expect(userProvider?.completeAuthCode).toBe('generated:48')
      expect(userProvider?.provider).toBe('google')
      expect(userProvider?.profileId).toBe('123')
      expect(userProvider?.displayName).toBe('Test User')
      expect(userProvider?.primaryEmail).toBe('test@example.com')
      expect(userProvider?.user).toEqual(user._id)
      expect(res.userProviderId).toEqual(userProvider?.id)
      expect(res.completeAuthCode).toBe('generated:48')
    })

    it('should verify the user if the profile email is verified', async () => {
      const user = await mock.createUser()
      await service.createOrUpdateAccountFromLoginProvider(
        user,
        'google',
        {
          provider: 'google',
          displayName: 'Test User',
          id: '123'
        },
        {
          value: 'test@example.com',
          verified: true
        }
      )
      const updatedUser = await service.findById(user.id)
      expect(updatedUser?.verified).toBe(true)
    })

    it('should not verify the user if the profile email is not verified', async () => {
      const user = await mock.createUser()
      await service.createOrUpdateAccountFromLoginProvider(
        user,
        'google',
        {
          provider: 'google',
          displayName: 'Test User',
          id: '123'
        },
        {
          value: 'test@example.com',
          verified: false
        }
      )
      const updatedUser = await service.findById(user.id)
      expect(updatedUser?.verified).toBe(false)
    })
  })

  describe('completeProviderAuth', () => {
    it('should complete a login given a valid code', async () => {
      const userProvider = await mock.createUserProviderDeep({ completeAuthCode: 'secret-code' })
      const res = await service.completeProviderAuth(userProvider.id, 'secret-code')
      const updatedUserProvider = await mock.userProviderService.findById(userProvider.id)
      expect(updatedUserProvider?.completeAuthCode).toBeNull()
      expect(res.isNew).toBe(false)
      expect(res.user).toEqual(mock.user)
    })

    it('should fail a login given an invalid code', async () => {
      const userProvider = await mock.createUserProviderDeep({ completeAuthCode: 'secret-code' })
      await expect(service.completeProviderAuth(userProvider.id, 'WRONG-CODE'))
        .rejects.toThrow(/Authentication code is invalid or it has expired/)
      const updatedUserProvider = await mock.userProviderService.findById(userProvider.id)
      expect(updatedUserProvider?.completeAuthCode).toBe('secret-code')
    })

    it('should complete a registration given a valid code and an unverified email', async () => {
      const userProvider = await mock.createUserProvider({
        displayName: 'Test User',
        completeAuthCode: 'secret-code',
        emails: [{ value: 'test@example.com', verified: false }]
      })
      const res = await service.completeProviderAuth(
        userProvider.id,
        'secret-code',
        'test',
        userProvider.primaryEmail
      )
      const user = await service.findOne({ username: 'test', email: userProvider.primaryEmail })
      expect(user?.name).toEqual('Test User')
      expect(user?.verified).toBe(false)
      expect(res.isNew).toBe(true)
      expect(res.user.id).toBe(user?.id)
    })

    it('should complete a registration given a valid code and an verified email', async () => {
      const userProvider = await mock.createUserProvider({
        displayName: 'Test User',
        completeAuthCode: 'secret-code',
        emails: [{ value: 'test@example.com', verified: true }]
      })
      const res = await service.completeProviderAuth(
        userProvider.id,
        'secret-code',
        'test',
        userProvider.primaryEmail
      )
      const user = await service.findOne({ username: 'test', email: userProvider.primaryEmail })
      expect(user?.name).toEqual('Test User')
      expect(user?.verified).toBe(true)
      expect(res.isNew).toBe(true)
      expect(res.user.id).toBe(user?.id)
    })

    it('should fail a register given an invalid code', async () => {
      const userProvider = await mock.createUserProvider({
        displayName: 'Test User',
        completeAuthCode: 'secret-code',
        emails: [{ value: 'test@example.com', verified: true }]
      })
      await expect(service.completeProviderAuth(
        userProvider.id,
        'WRONG-CODE',
        'test',
        userProvider.primaryEmail
      )).rejects.toThrow(/Authentication code is invalid or it has expired/)
      const updatedUserProvider = await mock.userProviderService.findById(userProvider.id)
      const user = await service.findOne({ username: 'test', email: userProvider.primaryEmail })
      expect(updatedUserProvider?.completeAuthCode).toBe('secret-code')
      expect(user).toBeNull()
    })
  })
})
