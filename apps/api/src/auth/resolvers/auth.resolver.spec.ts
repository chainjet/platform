import { HttpService } from '@nestjs/axios'
import { JwtModule } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { ReturnModelType } from '@typegoose/typegoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { EmailService } from '../../../../../libs/emails/src/services/email.service'
import { User } from '../../users/entities/user'
import { UserService } from '../../users/services/user.service'
import { AuthService } from '../services/auth.service'
import { AuthResolver } from './auth.resolver'

describe('AuthResolver', () => {
  let resolver: AuthResolver
  let mock: MockService
  let httpService: HttpService
  let emailService: EmailService
  let UserModel: ReturnModelType<typeof User>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test' }), MockModule],
      providers: [AuthResolver, AuthService],
    }).compile()

    resolver = module.get<AuthResolver>(AuthResolver)
    mock = module.get<MockService>(MockService)
    httpService = module.get<HttpService>(HttpService)
    emailService = module.get<EmailService>(EmailService)
    UserModel = module.get<UserService>(UserService).Model
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  beforeEach(() => {
    SecurityUtils.hashWithBcrypt = jest.fn((str: string) => Promise.resolve(`hashed(${str})`))
    SecurityUtils.bcryptHashIsValid = jest.fn((value: string, hash: string) =>
      Promise.resolve(hash === `hashed(${value})`),
    )
  })

  it('should be defined', () => {
    expect(resolver).toBeDefined()
  })

  describe('register', () => {
    beforeEach(() => {
      httpService.request = jest.fn(() => ({ toPromise: () => Promise.resolve() })) as jest.Mock
    })

    it('should create a new user', async () => {
      const res = await resolver.register('test@example.org', 'test', 'test')
      const user = await UserModel.findOne({ email: 'test@example.org' })
      expect(user?.username).toBe('test')
      expect(user?.verified).toBe(false)
      expect(user?.password).not.toBe('test')
      expect(res.user.id).toEqual(user?.id)
      expect(res.token.accessToken).toBeDefined()
      expect(res.token.accessTokenExpiration).toBeDefined()
      expect(res.token.refreshToken).toBeDefined()
      expect(httpService.request).toHaveBeenCalledTimes(1)
    })
  })

  describe('requestPasswordReset', () => {
    beforeEach(() => {
      emailService.sendEmailTemplate = jest.fn(() => Promise.resolve())
    })

    it('should send a reset password email given an existent email', async () => {
      await mock.createUser()
      const res = await resolver.requestPasswordReset('test@example.com')
      expect(emailService.sendEmailTemplate).toHaveBeenCalledTimes(1)
      expect(res.result).toBe(true)
    })

    it('should not send a reset password email given a non existent email', async () => {
      const res = await resolver.requestPasswordReset('not-an-user@example.com')
      expect(emailService.sendEmailTemplate).not.toHaveBeenCalled()
      expect(res.result).toBe(true)
    })
  })

  describe('completePasswordReset', () => {
    it('should update the password given a valid reset password code', async () => {
      await mock.createUser({
        username: 'test',
        password: 'old-password',
        resetPasswordToken: 'hashed(code)',
      })
      const res = await resolver.completePasswordReset('test', 'code', 'new-password')
      expect(res?.error).toBeUndefined()
      const user = await UserModel.findOne({ username: 'test' })
      expect(user?.password).toEqual('hashed(new-password)')
      expect(user?.resetPasswordToken).toBeNull()
    })

    it('should not update the password given an invalid reset password code', async () => {
      await mock.createUser({
        username: 'test',
        password: 'old-password',
        resetPasswordToken: 'hashed(code)',
      })
      const res = await resolver.completePasswordReset('test', 'invalid-code', 'new-password')
      expect(res.error).toEqual('Reset password code is invalid or it has expired.')
      const user = await UserModel.findOne({ username: 'test' })
      expect(user?.password).toEqual('old-password')
      expect(user?.resetPasswordToken).toEqual('hashed(code)')
    })

    it('should return the same error if the user does not exist', async () => {
      const res = await resolver.completePasswordReset('test', 'code', 'new-password')
      expect(res.error).toEqual('Reset password code is invalid or it has expired.')
    })
  })

  describe('completeExternalAuth', () => {
    it('should complete registration if the user is new', async () => {
      const user = mock.createUser()
      mock.userService.completeProviderAuth = jest.fn(() => Promise.resolve({ user, isNew: false })) as jest.Mock
      mock.authService.generateAndSaveRefreshToken = jest.fn(() => Promise.resolve('plainRefreshToken'))
      const res = await resolver.completeExternalAuth('id', 'code')
      expect(res.user).toEqual(user)
      expect(res.token.refreshToken).toEqual('plainRefreshToken')
    })

    it('should complete login if the user is not new', async () => {
      const user = mock.createUser()
      mock.userService.completeProviderAuth = jest.fn(() => Promise.resolve({ user, isNew: true })) as jest.Mock
      resolver.completeRegistration = jest.fn(() => Promise.resolve({})) as jest.Mock
      await resolver.completeExternalAuth('id', 'code')
      expect(resolver.completeRegistration).toHaveBeenCalledWith(user)
    })
  })
})
