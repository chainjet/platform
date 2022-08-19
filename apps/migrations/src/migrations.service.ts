import { Injectable } from '@nestjs/common'
import { Migration0001 } from './migrations/0001-add-iusername-prop'

@Injectable()
export class MigrationsService {
  constructor(private migration: Migration0001) {}

  async onModuleInit() {
    await this.migration.run()
  }
}
