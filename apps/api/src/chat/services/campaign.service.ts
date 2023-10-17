import { BaseService } from '@app/common/base/base.service'
import { InjectQueue } from '@nestjs/bull'
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { Queue } from 'bull'
import { InjectModel } from 'nestjs-typegoose'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { Campaign, CampaignState } from '../entities/campaign'

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
    const accountCredentialId = record.credentials?.toString()
    if (!accountCredentialId) {
      throw new BadRequestException('Account credential ID is required')
    }

    const accountCredential = await this.accountCredentialService.findOne({
      _id: accountCredentialId,
      owner: record.owner,
    })
    if (!accountCredential) {
      throw new NotFoundException(`AccountCredential ${accountCredentialId} not found`)
    }

    if (record.scheduleDate) {
      record.state = CampaignState.Scheduled
    }
    const campaign = await super.createOne(record)

    if (!campaign.scheduleDate) {
      this.logger.debug(`Queuing campaign ${campaign.id} for broadcast`)
      this.broadcastQueue.add(
        {
          ownerId: campaign.owner,
          campaignId: campaign.id,
          accountCredentialId,
        },
        {
          jobId: `broadcast-${campaign.id}`,
          attempts: 3,
        },
      )
    }

    return campaign
  }

  async processSchedule(campaign: Campaign): Promise<boolean> {
    const __v = (campaign as any).__v

    try {
      const res = await this.updateOneNative(
        { _id: campaign._id, __v },
        { $unset: { scheduleDate: '' }, $set: { state: CampaignState.Pending } },
      )
      return res.modifiedCount === 1
    } catch (e) {
      this.logger.error(`Error processing schedule for ${campaign.id}: ${e.message}`)
    }
    return false
  }
}
