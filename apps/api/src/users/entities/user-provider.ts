import { prop } from '@typegoose/typegoose'
import { BaseEntity } from '../../../../../libs/common/src/base/base-entity'
import { Reference } from '../../../../../libs/common/src/typings/mongodb'
import { LoginProvider } from '../../auth/external-oauth/login-strategies/LoginProviderStrategy'
import { User } from './user'

class UserProviderName {
  @prop()
  familyName: string

  @prop()
  givenName: string

  @prop()
  middleName?: string
}

class UserProviderEmail {
  @prop()
  value: string

  @prop()
  verified?: boolean

  @prop()
  type?: string
}

class UserProviderPhoto {
  @prop()
  value: string
}

export class UserProvider extends BaseEntity {
  @prop({ ref: User, index: true, sparse: true })
  user?: Reference<User>

  @prop({ required: true })
  provider: LoginProvider

  @prop()
  primaryEmail?: string

  // User id on the provider
  @prop()
  profileId?: string

  @prop()
  displayName?: string

  @prop()
  username?: string

  @prop({ type: UserProviderEmail })
  name?: UserProviderName

  @prop({})
  emails?: UserProviderEmail[]

  @prop({})
  photos?: UserProviderPhoto[]

  @prop()
  completeAuthCode?: string
}
