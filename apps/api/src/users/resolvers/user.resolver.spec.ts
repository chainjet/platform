import { Test, TestingModule } from '@nestjs/testing'
import { TypegooseModule } from 'nestjs-typegoose'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { User } from '../entities/user'
import { UserProvider } from '../entities/user-provider'
import { UserProviderService } from '../services/user-provider.service'
import { UserService } from '../services/user.service'
import { UserAuthorizer } from './user.authorizer'
import { UserResolver } from './user.resolver'

describe('UserResolver', () => {
  let resolver: UserResolver
  let mock: MockService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([User, UserProvider]), MockModule],
      providers: [UserResolver, UserService, UserAuthorizer, UserProviderService],
    }).compile()

    resolver = module.get<UserResolver>(UserResolver)
    mock = module.get<MockService>(MockService)
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
    expect(resolver).toBeDefined()
  })

  describe('viewer', () => {
    it('should return the given user', async () => {
      const user = await mock.createUser({ username: 'test', email: 'test@example.org' })
      const res = await resolver.viewer(user._id)
      expect(res?.username).toEqual('test')
      expect(res?.email).toEqual('test@example.org')
    })
  })

  describe('changePassword', () => {
    it('should update the password if the old password is correct', async () => {
      const user = await mock.createUser({
        email: 'test@example.org',
        password: 'hashed(old-password)',
      })
      await resolver.changePassword(user._id, 'old-password', 'new-password')
      const updated = await mock.userService.findById(user.id)
      expect(updated?.password).toEqual('hashed(new-password)')
    })

    it('should not update the password if the old password is incorrect', async () => {
      const user = await mock.createUser({
        email: 'test@example.org',
        password: 'hashed(old-password)',
      })
      await expect(resolver.changePassword(user._id, 'wrong-password', 'new-password')).rejects.toThrow(
        'Old password is not correct.',
      )
      const updated = await mock.userService.findById(user.id)
      expect(updated?.password).toEqual('hashed(old-password)')
    })
  })

  describe('generateApiKey', () => {
    it('should generate and save a new api key', async () => {
      const user = await mock.createUser()
      const payload = await resolver.generateApiKey(user._id)
      expect(payload.apiKey).toEqual(`${user.username}:generated:48`)
      const updated = await mock.userService.findById(user.id)
      expect(updated?.apiKey).toEqual('test:generated:48')
    })
  })
})
