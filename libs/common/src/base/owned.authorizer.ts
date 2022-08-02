import { BaseEntity } from '@app/common/base/base-entity'
import { Filter } from '@nestjs-query/core'
import { Authorizer } from '@nestjs-query/query-graphql'
import { Injectable } from '@nestjs/common'
import { Types } from 'mongoose'
import { ADMIN_USERS } from '../../../../apps/api/src/auth/config/admins'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

@Injectable()
export class OwnedAuthorizer<T extends BaseEntity> implements Authorizer<T> {
  async authorize(context: GqlContext): Promise<Filter<any>> {
    if (ADMIN_USERS.includes(context.req.user.username)) {
      return {}
    }

    return { owner: { eq: new Types.ObjectId(context.req.user.id.toString()) } }
  }

  authorizeRelation(relationName: string, context: GqlContext): Promise<Filter<unknown>> {
    return Promise.resolve({})
  }
}
