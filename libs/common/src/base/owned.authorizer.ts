import { BaseEntity } from '@app/common/base/base-entity'
import { Injectable } from '@nestjs/common'
import { Filter } from '@ptc-org/nestjs-query-core'
import { Authorizer, CustomAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { Types } from 'mongoose'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

@Injectable()
export class OwnedAuthorizer<T extends BaseEntity> implements CustomAuthorizer<T> {
  async authorize(context: GqlContext): Promise<Filter<T>> {
    if (process.env.ADMIN_ROLE_KEY) {
      const admins = process.env.ADMIN_USERS?.split(',') || []
      if (
        admins.includes(context.req.user.username) &&
        context.req.headers['x-role-key'] === process.env.ADMIN_ROLE_KEY
      ) {
        return {}
      }
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
