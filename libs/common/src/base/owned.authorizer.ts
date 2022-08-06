import { BaseEntity } from '@app/common/base/base-entity'
import { Injectable } from '@nestjs/common'
import { Filter } from '@ptc-org/nestjs-query-core'
import { Authorizer } from '@ptc-org/nestjs-query-graphql'
import { Types } from 'mongoose'
import { ADMIN_USERS } from '../../../../apps/api/src/auth/config/admins'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

@Injectable()
export class OwnedAuthorizer<T extends BaseEntity> implements Authorizer<T> {
  async authorize(context: GqlContext): Promise<Filter<T>> {
    if (ADMIN_USERS.includes(context.req.user.username)) {
      return {}
    }

    return { owner: { eq: new Types.ObjectId(context.req.user.id.toString()) } } as unknown as Filter<T>
  }

  authorizeRelation(relationName: string, context: GqlContext): Promise<Filter<unknown>> {
    return Promise.resolve({})
  }
}

@Injectable()
export class NotOwnedAuthorizer<T extends BaseEntity> implements Authorizer<T> {
  async authorize(context: GqlContext): Promise<Filter<T>> {
    return {}
  }

  authorizeRelation(relationName: string, context: GqlContext): Promise<Filter<unknown>> {
    return Promise.resolve({})
  }
}
