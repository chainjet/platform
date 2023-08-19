import { BaseService } from '@app/common/base/base.service'
import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { InjectModel } from 'nestjs-typegoose'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { Campaign } from '../entities/campaign'

@Injectable()
export class CampaignService extends BaseService<Campaign> {
  protected readonly logger = new Logger(CampaignService.name)

  constructor(
    @InjectModel(Campaign) protected readonly model: ReturnModelType<typeof Campaign>,
    @InjectQueue('broadcast') private broadcastQueue: Queue,
    private accountCredentialService: AccountCredentialService,
  ) {
    super(model)
  }

  async createOne(record: Partial<Campaign>): Promise<Campaign> {
    const accountCredentialId: string = (record as any).accountCredentialId
    delete (record as any).accountCredentialId

    const accountCredential = await this.accountCredentialService.findOne({
      _id: accountCredentialId,
      owner: record.owner,
    })
    if (!accountCredential) {
      throw new NotFoundException(`AccountCredential ${accountCredentialId} not found`)
    }

    const campaign = await super.createOne(record)

    this.logger.debug(`Queuing campaign ${campaign.id} for broadcast`)
    this.broadcastQueue.add(
      {
        ownerId: campaign.owner,
        campaignId: campaign.id,
        accountCredentialId,
      },
      {
        attempts: 3,
      },
    )

    return campaign
  }
}
