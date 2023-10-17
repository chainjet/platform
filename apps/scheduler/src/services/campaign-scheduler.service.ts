import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { Campaign, CampaignState } from 'apps/api/src/chat/entities/campaign'
import { CampaignService } from 'apps/api/src/chat/services/campaign.service'
import { Queue } from 'bull'

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name)
  private processInterrupted: boolean = false

  constructor(
    private readonly campaignService: CampaignService,
    @InjectQueue('broadcast') private broadcastQueue: Queue,
  ) {}

  @Interval(10 * 1000 + Math.floor(Math.random() * 3000))
  async scheduleCampaignChecksInterval(): Promise<void> {
    if (process.env.NODE_ENV !== 'test' && !this.processInterrupted) {
      await this.scheduleCampaignChecks()
    }
  }

  onModuleDestroy() {
    this.logger.log('Process interrupted, stopping schedulers')
    this.processInterrupted = true
  }

  async scheduleCampaignChecks(): Promise<void> {
    this.logger.log('Running campaign scheduler')

    // Get campaigns to be checked
    const campaigns = await this.campaignService.find({
      scheduleDate: {
        $lt: new Date(),
      },
      state: CampaignState.Scheduled,
    })

    // Update campaign states with versioning
    const campaignsToRun: Campaign[] = []
    for (const campaign of campaigns) {
      const res = await this.campaignService.processSchedule(campaign)
      if (res) {
        campaignsToRun.push(campaign)
      }
    }

    this.logger.log(`Found ${campaignsToRun.length} campaigns to be checked`)

    for (const campaign of campaignsToRun) {
      this.logger.debug(`Queuing campaign ${campaign.id} for broadcast`)
      this.broadcastQueue.add(
        {
          ownerId: campaign.owner,
          campaignId: campaign.id,
          accountCredentialId: campaign.credentials,
        },
        {
          jobId: `broadcast-${campaign.id}`,
          attempts: 3,
        },
      )
    }
  }
}
