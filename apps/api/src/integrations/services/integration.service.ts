import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Integration } from '../entities/integration'

@Injectable()
export class IntegrationService extends BaseService<Integration> {
  protected readonly logger = new Logger(IntegrationService.name)
  static instance: IntegrationService

  constructor(@InjectModel(Integration) protected readonly model: ReturnModelType<typeof Integration>) {
    super(model)
    IntegrationService.instance = this
  }

  async createOrUpdateOne(record: DeepPartial<Integration>): Promise<Integration> {
    const query = {
      key: record.key,
      version: record.version,
    }
    return await super.createOrUpdateOne(query, record)
  }
}
