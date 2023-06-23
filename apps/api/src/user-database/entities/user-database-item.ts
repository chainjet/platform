import { BaseEntity } from '@app/common/base/base-entity'
import { OwnedAuthorizer } from '@app/common/base/owned.authorizer'
import { EntityRef } from '@app/common/decorators/entity-ref.decorator'
import { OwnedEntity } from '@app/common/decorators/owned-entity.decorator'
import { Reference } from '@app/common/typings/mongodb'
import { Injectable } from '@nestjs/common'
import { ObjectType } from '@nestjs/graphql'
import { Authorize } from '@ptc-org/nestjs-query-graphql'
import { Index, prop } from '@typegoose/typegoose'
import { User } from '../../users/entities/user'
import { UserDatabase } from './user-database'

@Injectable()
export class UserDatabaseItemAuthorizer extends OwnedAuthorizer<UserDatabaseItem> {}

@ObjectType()
@OwnedEntity()
@Authorize<UserDatabaseItem>(UserDatabaseItemAuthorizer)
@Index({ owner: 1, database: 1, key: 1 }, { unique: true })
@EntityRef('database', () => UserDatabase)
export class UserDatabaseItem extends BaseEntity {
  @prop({ ref: User, required: true })
  readonly owner!: Reference<User>

  @prop({ ref: UserDatabase, required: true })
  readonly database!: Reference<UserDatabase>

  @prop({ required: true })
  key: string

  @prop({ required: true })
  value: any
}

// @InputType()
// export class CreateUserDatabaseItemInput {}

// @InputType()
// export class UpdateUserDatabaseItemInput {}
