import { CommonModule } from '@app/common'
import { NestjsQueryTypegooseModule } from '@app/common/NestjsQueryTypegooseModule'
import { Test, TestingModule } from '@nestjs/testing'
import { NestjsQueryGraphQLModule } from '@ptc-org/nestjs-query-graphql'
import { SecurityUtils } from '../../../../../libs/common/src/utils/security.utils'
import { TestDatabaseModule, closeMongoConnection } from '../../../../../libs/common/test/database/test-database.module'
import { MockModule } from '../../../../../libs/common/test/mock.module'
import { MockService } from '../../../../../libs/common/test/mock.service'
import { User } from '../entities/user'
import { UserService } from '../services/user.service'
import { UserAuthorizer } from './user.authorizer'
import { UserResolver } from './user.resolver'

describe('UserResolver', () => {
  let resolver: UserResolver
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        NestjsQueryGraphQLModule.forFeature({
          imports: [NestjsQueryTypegooseModule.forFeature([User])],
          dtos: [{ DTOClass: User }],
        }),
        MockModule,
        CommonModule,
      ],
      providers: [UserResolver, UserService, UserAuthorizer],
    }).compile()

    resolver = testModule.get<UserResolver>(UserResolver)
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
    expect(resolver).toBeDefined()
  })

  describe('viewer', () => {
    it('should return the given user', async () => {
      const user = await mock.createUser({ address: '0xffffffffffffffffffffffffffffffffffffffff' })
      const res = await resolver.viewer(user._id)
      expect(res?.address).toEqual('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF')
    })
  })
})
