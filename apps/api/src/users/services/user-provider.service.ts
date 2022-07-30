import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { UserProvider } from '../entities/user-provider'

@Injectable()
export class UserProviderService extends BaseService<UserProvider> {
  protected readonly logger = new Logger(UserProviderService.name)

  constructor (
    @InjectModel(UserProvider) protected readonly model: ReturnModelType<typeof UserProvider>
  ) {
    super(model)
  }
}
