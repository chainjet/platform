import { Injectable } from '@nestjs/common'
import { Migration0002 } from './migrations/0002-remove-integration'

@Injectable()
export class MigrationsService {
  constructor(private migration: Migration0002) {}

  async onModuleInit() {
    await this.migration.run()
  }
}
