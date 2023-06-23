import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { Index, prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'

@Injectable()
export class UserDatabaseAuthorizer extends OwnedAuthorizer<UserDatabase> {}

@ObjectType()
@OwnedEntity()
@Authorize<UserDatabase>(UserDatabaseAuthorizer)
@Index({ owner: 1, key: 1 }, { unique: true })
export class UserDatabase extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @prop({ required: true })
  key: string
}

// @InputType()
// export class CreateUserDatabaseInput {}

// @InputType()
// export class UpdateUserDatabaseInput {}
