import { redisForRoot } from '@app/common/utils/redis.utils'
import { DefinitionsModule } from '@app/definitions'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { mongoForRoot } from '../../../libs/common/src/utils/mongodb'
import { BootstrapService } from './services/bootstrap.service'

@Module({
  imports: [ConfigModule.forRoot(), redisForRoot(), mongoForRoot(), DefinitionsModule],
  controllers: [],
  providers: [BootstrapService],
})
export class BootstrapModule {}
