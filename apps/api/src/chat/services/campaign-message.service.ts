import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { CampaignMessage } from '../entities/campaign-message'

@Injectable()
export class CampaignMessageService extends BaseService<CampaignMessage> {
  protected readonly logger = new Logger(CampaignMessageService.name)

  constructor(@InjectModel(CampaignMessage) protected readonly model: ReturnModelType<typeof CampaignMessage>) {
    super(model)
  }
}
