import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Assistant } from '../entities/assistant'

@Injectable()
export class AssistantService extends BaseService<Assistant> {
  protected readonly logger = new Logger(AssistantService.name)
  static instance: AssistantService

  constructor(@InjectModel(Assistant) protected readonly model: ReturnModelType<typeof Assistant>) {
    super(model)
    AssistantService.instance = this
  }
}
