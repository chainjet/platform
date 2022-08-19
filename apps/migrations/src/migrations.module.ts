import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UsersModule } from 'apps/api/src/users/users.module'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { MigrationsService } from './migrations.service'
import { Migration0001 } from './migrations/0001-add-iusername-prop'

@Module({
  imports: [ConfigModule.forRoot(), mongoForRoot(), UsersModule],
  controllers: [],
  providers: [MigrationsService, Migration0001],
})
export class MigrationsModule {}
