import { BaseEntity } from '@app/common/base/base-entity'
import { Reference } from '@app/common/typings/mongodb'
import { Index, prop } from '@typegoose/typegoose'
import { Campaign } from './campaign'

@Index({ campaign: 1, address: 1 }, { unique: true })
export class CampaignMessage extends BaseEntity {
  @prop({ ref: Campaign, required: true })
  readonly campaign!: Reference<Campaign>

  @prop({ required: true })
  readonly address: string

  @prop({ required: true })
  messageId: string
}
