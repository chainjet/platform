import { BaseService } from '@app/common/base/base.service'
import { NotOwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common'
import { DeepPartial } from '@ptc-org/nestjs-query-core'
import { ReturnModelType } from '@typegoose/typegoose'
import { Cache } from 'cache-manager'
import { InjectModel } from 'nestjs-typegoose'
import { IntegrationAction } from '../entities/integration-action'

@Injectable()
export class IntegrationActionAuthorizer extends NotOwnedAuthorizer<IntegrationAction> {}

@Injectable()
export class IntegrationActionService extends BaseService<IntegrationAction> {
  protected readonly logger = new Logger(IntegrationActionService.name)
  static instance: IntegrationActionService
  // protected cacheKey = 'integration-action'
  protected enableFullCache = true

  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    @InjectModel(IntegrationAction) protected readonly model: ReturnModelType<typeof IntegrationAction>,
  ) {
    super(model)
    IntegrationActionService.instance = this
  }

  async createOrUpdateOne(record: DeepPartial<IntegrationAction>): Promise<IntegrationAction> {
    const query = {
      integration: record.integration,
      key: record.key,
    }
    return await super.createOrUpdateOne(query, record)
  }
}
