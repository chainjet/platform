import { Test, TestingModule } from '@nestjs/testing'
import { TestDatabaseModule } from 'libs/common/test/database/test-database.module'
import { MockModule } from 'libs/common/test/mock.module'
import { TypegooseModule } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { Contact } from '../entities/contact'
import { ContactService } from './contact.service'

describe('ContactService', () => {
  let service: ContactService

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [TestDatabaseModule, TypegooseModule.forFeature([Contact]), MockModule],
      providers: [ContactService],
    }).compile()

    service = testModule.get<ContactService>(ContactService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('resolveContactData', () => {
    it('should resolve walletName correctly', async () => {
      const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const result = await service.resolveContactData(address, 'walletName', new User())
      expect(result).toEqual('vitalik.eth')
    })

    it('should resolve ens correctly', async () => {
      const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const result = await service.resolveContactData(address, 'ens', new User())
      expect(result).toEqual('vitalik.eth')
    })

    it('should resolve lens correctly', async () => {
      const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const result = await service.resolveContactData(address, 'lens', new User())
      expect(result).toEqual('vitalik.lens')
    })

    it('should resolve farcaster correctly', async () => {
      const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      const result = await service.resolveContactData(address, 'farcaster', new User())
      expect(result).toEqual('vitalik.eth')
    })
  })
})
