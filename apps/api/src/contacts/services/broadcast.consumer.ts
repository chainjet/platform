import { JobNonRetriableError } from '@app/common/errors/job-non-retriable-error'
import { XmtpLib } from '@app/definitions/integration-definitions/xmtp/xmtp.lib'
import { sendXmtpMessage } from '@chainjet/tools/dist/messages'
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { AccountCredentialService } from '../../account-credentials/services/account-credentials.service'
import { UserService } from '../../users/services/user.service'
import { CampaignState } from '../entities/campaign'
import { CampaignMessageService } from './campaign-message.service'
import { CampaignService } from './campaign.service'
import { ContactService } from './contact.service'

@Processor('broadcast')
export class BroadcastConsumer {
  private readonly logger = new Logger(BroadcastConsumer.name)

  constructor(
    private campaignService: CampaignService,
    private campaignMessageService: CampaignMessageService,
    private contactsService: ContactService,
    private accountCredentialService: AccountCredentialService,
    private userService: UserService,
  ) {}

  @Process()
  async send(job: Job<{ campaignId: string; ownerId: string; accountCredentialId: string }>) {
    this.logger.log(`Broadcasting campaign ${job.data.campaignId}`)
    const user = await this.userService.findOne({
      _id: job.data.ownerId,
    })
    if (!user) {
      throw new JobNonRetriableError(job, `User ${job.data.ownerId} not found`)
    }
    const campaign = await this.campaignService.findOne({
      _id: job.data.campaignId,
      owner: job.data.ownerId,
    })
    if (!campaign) {
      throw new JobNonRetriableError(job, `Campaign ${job.data.campaignId} not found`)
    }
    const accountCredential = await this.accountCredentialService.findOne({
      _id: job.data.accountCredentialId,
      owner: job.data.ownerId,
    })
    if (!accountCredential) {
      throw new JobNonRetriableError(job, `AccountCredential ${job.data.accountCredentialId} not found`)
    }
    let contacts = await this.contactsService.find({
      owner: campaign.owner,
      ...(campaign.includeTags?.length && { tags: { $in: campaign.includeTags } }),
    })
    const client = await XmtpLib.getClient(accountCredential.credentials.keys)

    // if this is a retry, filter out contacts that have already been sent a message
    if (job.attemptsMade > 0) {
      const campaignMessages = await this.campaignMessageService.find({
        campaign: campaign._id,
      })
      const campaignMessageAddresses = campaignMessages.map((campaignMessage) => campaignMessage.address)
      contacts = contacts.filter((contact) => !campaignMessageAddresses.includes(contact.address))
    }

    this.logger.log(`Sending campaign ${campaign._id} to ${contacts.length} contacts`)

    if (campaign.state === CampaignState.Pending) {
      campaign.state = CampaignState.Running
      await this.campaignService.updateOneNative(
        {
          _id: campaign._id,
        },
        {
          $set: {
            state: campaign.state,
          },
        },
      )
    }

    campaign.delivered = 0
    campaign.total = contacts.length

    for (const contact of contacts) {
      try {
        const message = await sendXmtpMessage(client, contact.address, campaign.message)
        campaign.delivered++
        await this.campaignMessageService.createOne({
          campaign: campaign._id,
          address: contact.address,
          messageId: message.id,
        })
        this.logger.log(`Sent broadcast message from ${user.address} to ${contact.address}`)
      } catch {}
      campaign.processed++
      job.progress(campaign.processed / campaign.total)
    }

    await this.campaignService.updateOneNative(
      {
        _id: campaign._id,
      },
      {
        $set: {
          delivered: campaign.delivered,
          processed: campaign.processed,
          total: campaign.total,
          state: CampaignState.Completed,
        },
      },
    )

    await this.userService.updateOneNative(
      {
        _id: user._id,
      },
      {
        $inc: {
          operationsUsedMonth: campaign.delivered,
          operationsUsedTotal: campaign.delivered,
        },
      },
    )

    return {}
  }
}
