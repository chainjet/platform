import { Injectable } from '@nestjs/common'
import { Migration0003 } from './migrations/0003-add-workflow-owner-address'

@Injectable()
export class MigrationsService {
  constructor(private migration: Migration0003) {}

  async onModuleInit() {
    await this.migration.run()
  }
}
