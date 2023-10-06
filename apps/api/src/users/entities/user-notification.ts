import { BaseEntity } from '@app/common/base/base-entity'
import { Reference } from '@app/common/typings/mongodb'
import { Index, prop } from '@typegoose/typegoose'
import { User } from './user'

@Index({ user: 1, key: 1 }, { unique: true })
export class UserNotification extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly user!: Reference<User>

  @prop({ required: true })
  readonly key: string
}
