import { Class } from '@ptc-org/nestjs-query-core'
import { CursorConnection, Relation } from '@ptc-org/nestjs-query-graphql'
import {
  RelationOneDecoratorOpts,
  RelationTypeFunc,
} from '@ptc-org/nestjs-query-graphql/src/decorators/relation.decorator'

export function EntityRef<DTO, Rel>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Rel>,
  options?: RelationOneDecoratorOpts<Rel>,
): <Cls extends Class<DTO>>(DTOClass: Cls) => void | Cls {
  return Relation(name, relationTypeFunc, {
    disableUpdate: true,
    disableRemove: true,
    ...(options ?? {}),
  })
}

export function EntityConnection<DTO, Rel>(
  name: string,
  relationTypeFunc: RelationTypeFunc<Rel>,
  options?: RelationOneDecoratorOpts<Rel>,
): <Cls extends Class<DTO>>(DTOClass: Cls) => void | Cls {
  return CursorConnection(name, relationTypeFunc, {
    disableUpdate: true,
    disableRemove: true,
    ...(options ?? {}),
  })
}
