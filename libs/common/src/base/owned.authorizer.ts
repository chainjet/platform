import { BaseEntity } from '@app/common/base/base-entity'
import { Injectable } from '@nestjs/common'
import { Filter } from '@ptc-org/nestjs-query-core'
import { AuthorizationContext, Authorizer, CustomAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { Types } from 'mongoose'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

@Injectable()
export class OwnedAuthorizer<T extends BaseEntity> implements CustomAuthorizer<T> {
  async authorize(context: GqlContext, authorizationContext?: AuthorizationContext): Promise<Filter<T>> {
    if (process.env.ADMIN_ROLE_KEY) {
      const admins = process.env.ADMIN_USERS?.split(',') || []
      if (
        admins.includes(context.req.user.address) &&
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
export abstract class OwnedAuthorizerWithCustomPrivacy<T extends BaseEntity> extends OwnedAuthorizer<T> {
  abstract sharableRelations: string[]
  ownerRelationName = 'owner'

  async authorize(context: GqlContext, authorizationContext?: AuthorizationContext): Promise<Filter<T>> {
    const filter = await super.authorize(context, authorizationContext)
    if (authorizationContext?.readonly && authorizationContext?.many === false) {
      if ('owner' in filter) {
        return { or: [{ owner: (filter as any).owner }, { isPublic: { eq: true } }] } as unknown as Filter<T>
      }
    }
    return filter
  }

  async authorizeRelation(
    relationName: string,
    context: GqlContext,
    authorizationContext?: AuthorizationContext,
  ): Promise<Filter<unknown>> {
    if (this.sharableRelations.includes(relationName)) {
      return {}
    }

    const filter = await this.authorize(context, authorizationContext)
    const filterHasPrivacy = '$or' in filter && (filter as any).$or.some((item) => item.isPublic)
    if (filterHasPrivacy) {
      if (relationName === this.ownerRelationName) {
        return {
          address: { eq: context.req.user.address },
        } as Filter<unknown>
      }
      return { owner: { eq: new Types.ObjectId(context.req.user.id.toString()) } } as Filter<unknown>
    }
    return {}
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
