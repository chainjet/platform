import { BeforeCreateOne, CreateOneInputType } from '@nestjs-query/query-graphql'
import { GqlContext } from '../../../../apps/api/src/auth/typings/gql-context'

export interface OwnedEntityOptions {
  ownerField?: string
}

export function OwnedEntity (opts: OwnedEntityOptions = {}): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return <T extends Function> (target: T): T => {
    const ownerField = opts.ownerField ?? 'owner'

    // Add the owner from the auth request
    BeforeCreateOne((query: CreateOneInputType<any>, context: GqlContext) => {
      return {
        ...query,
        input: {
          ...query.input,
          [ownerField]: context.req.user.id
        }
      }
    })(target)

    return target
  }
}
