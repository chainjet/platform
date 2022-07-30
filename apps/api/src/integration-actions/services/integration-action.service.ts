import { BaseService } from '@app/common/base/base.service'
import { DeepPartial } from '@nestjs-query/core'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationAction } from '../entities/integration-action'

@Injectable()
export class IntegrationActionService extends BaseService<IntegrationAction> {
  protected readonly logger = new Logger(IntegrationActionService.name)

  constructor (
    @InjectModel(IntegrationAction) protected readonly model: ReturnModelType<typeof IntegrationAction>
  ) {
    super(model)
  }

  async createOrUpdateOne (record: DeepPartial<IntegrationAction>): Promise<IntegrationAction> {
    const query = {
      integration: record.integration,
      key: record.key
    }
    return await super.createOrUpdateOne(query, record)
  }
}
