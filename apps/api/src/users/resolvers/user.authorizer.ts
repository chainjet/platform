import { Injectable } from '@nestjs/common'
import { Filter } from '@ptc-org/nestjs-query-core'
import { Authorizer } from '@ptc-org/nestjs-query-graphql'
import { GqlContext } from '../../auth/typings/gql-context'
import { User } from '../entities/user'

@Injectable()
export class UserAuthorizer implements Authorizer<User> {
  async authorize(context: GqlContext): Promise<Filter<User>> {
    return { address: { eq: context.req.user?.address ?? '-' } }
  }

  authorizeRelation(relationName: string, context: GqlContext): Promise<Filter<unknown>> {
    return Promise.resolve({})
  }
}
