import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { EvmContract } from '../entities/evm-contracts'

@Injectable()
export class EvmContractService extends BaseService<EvmContract> {
  protected readonly logger = new Logger(EvmContractService.name)

  constructor(@InjectModel(EvmContract) protected readonly model: ReturnModelType<typeof EvmContract>) {
    super(model)
  }
}
