import { UnauthorizedException } from '@nestjs/common'
import { BeforeCreateOne, CreateOneInputType } from '@ptc-org/nestjs-query-graphql'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

export interface OwnedEntityOptions {
  ownerField?: string
}

export function OwnedEntity(opts: OwnedEntityOptions = {}): ClassDecorator {
  return <T extends Function>(target: T): T => {
    const ownerField = opts.ownerField ?? 'owner'

    // Add the owner from the auth request
    BeforeCreateOne((query: CreateOneInputType<any>, context: GqlContext) => {
      if (!context.req.user) {
        throw new UnauthorizedException(`Unauthorized`)
      }
      return {
        ...query,
        input: {
          ...query.input,
          [ownerField]: context.req.user.id,
        },
      }
    })(target)

    return target
  }
}
