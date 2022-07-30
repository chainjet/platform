import { BaseService } from '@app/common/base/base.service'
import { DeepPartial } from '@nestjs-query/core'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationAccount } from '../entities/integration-account'

@Injectable()
export class IntegrationAccountService extends BaseService<IntegrationAccount> {
  protected readonly logger = new Logger(IntegrationAccountService.name)

  constructor (
    @InjectModel(IntegrationAccount) protected readonly model: ReturnModelType<typeof IntegrationAccount>
  ) {
    super(model)
  }

  async createOrUpdateOne (record: DeepPartial<IntegrationAccount>): Promise<IntegrationAccount> {
    return await super.createOrUpdateOne({ key: record.key }, record)
  }
}
