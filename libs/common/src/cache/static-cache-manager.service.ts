import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common'
import { Cache } from 'cache-manager'

@Injectable()
export class StaticCacheManagerService {
  static cacheManager: Cache

  constructor(@Inject(CACHE_MANAGER) cacheManager: Cache) {
    StaticCacheManagerService.cacheManager = cacheManager
  }
}
