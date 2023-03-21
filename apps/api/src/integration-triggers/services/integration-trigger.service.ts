import { BaseService } from '@app/common/base/base.service'
import { NotOwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Cache } from 'cache-manager'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationTrigger } from '../entities/integration-trigger'

@Injectable()
export class IntegrationTriggerAuthorizer extends NotOwnedAuthorizer<IntegrationTrigger> {}

@Injectable()
export class IntegrationTriggerService extends BaseService<IntegrationTrigger> {
  protected readonly logger = new Logger(IntegrationTriggerService.name)
  static instance: IntegrationTriggerService
  // protected cacheKey = 'integration-trigger'

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    @InjectModel(IntegrationTrigger) protected readonly model: ReturnModelType<typeof IntegrationTrigger>,
  ) {
    super(model)
    IntegrationTriggerService.instance = this
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
