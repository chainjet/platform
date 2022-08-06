import { BaseService } from '@app/common/base/base.service'
import { NotOwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { Injectable, Logger } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationTrigger } from '../entities/integration-trigger'

@Injectable()
export class IntegrationTriggerAuthorizer extends NotOwnedAuthorizer<IntegrationTrigger> {}

@Injectable()
export class IntegrationTriggerService extends BaseService<IntegrationTrigger> {
  protected readonly logger = new Logger(IntegrationTriggerService.name)

  constructor(@InjectModel(IntegrationTrigger) protected readonly model: ReturnModelType<typeof IntegrationTrigger>) {
    super(model)
  }

  async createOrUpdateOne(record: DeepPartial<IntegrationTrigger>): Promise<IntegrationTrigger> {
    if (!record.integration || !record.key) {
      throw new Error('Cannot create or update a integration trigger without integration and key')
    }
    const query = {
      integration: record.integration,
      key: record.key,
    }
    return await super.createOrUpdateOne(query, record)
  }
}
