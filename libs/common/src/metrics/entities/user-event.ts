import { BaseEntity } from '@app/common/base/base-entity'
import { Reference } from '@app/common/typings/mongodb'
import { Index, prop } from '@typegoose/typegoose'
import { User } from 'apps/api/src/users/entities/user'

export enum UserEventKey {
  OPERATION_SUCCEDED,
  OPERATION_FAILED,
}

@Index({ user: 1, key: 1, date: 1 }, { unique: true })
export class UserEvent extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly user: Reference<User>

  @prop({ required: true })
  readonly key: UserEventKey | string

  /**
   * date is in the format of YYYY-MM-DD
   */
  @prop({ required: true, validate: (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) })
  readonly date: string

  @prop({ required: true })
  value: number
}
