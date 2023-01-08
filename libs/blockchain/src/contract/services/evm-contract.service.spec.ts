import { Test, TestingModule } from '@nestjs/testing'
import { closeMongoConnection } from 'libs/common/test/database/test-database.module'
import { MockModule } from 'libs/common/test/mock.module'
import { MockService } from 'libs/common/test/mock.service'
import { TypegooseModule } from 'nestjs-typegoose'

import { EvmContract } from '../entities/evm-contracts'
import { EvmContractService } from './evm-contract.service'

describe('EvmContract', () => {
  let service: EvmContractService
  let mock: MockService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TypegooseModule.forFeature([EvmContract]), MockModule],
      providers: [EvmContractService],
    }).compile()

    service = testModule.get<EvmContractService>(EvmContractService)
    mock = testModule.get<MockService>(MockService)
  })

  afterEach(async () => await mock.dropDatabase())
  afterAll(async () => await closeMongoConnection())

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
