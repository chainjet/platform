import { Class } from '@nestjs-query/core'
import { Relation } from '@nestjs-query/query-graphql'
import {
  Connection,
  ConnectionTypeFunc,
  RelationDecoratorOpts,
  RelationTypeFunc
} from '@nestjs-query/query-graphql/dist/src/decorators/relation.decorator'

export function EntityRef<DTO, Rel> (
  name: string,
  relationTypeFunc: RelationTypeFunc<Rel>,
  options?: RelationDecoratorOpts<Rel>
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): <Cls extends Class<DTO>>(DTOClass: Cls) => void | Cls {
  return Relation(name, relationTypeFunc, {
    disableUpdate: true,
    disableRemove: true,
    ...(options ?? {})
  })
}

export function EntityConnection<DTO, Rel> (
  name: string,
  relationTypeFunc: ConnectionTypeFunc<Rel>,
  options?: RelationDecoratorOpts<Rel>
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): <Cls extends Class<DTO>>(DTOClass: Cls) => void | Cls {
  return Connection(name, relationTypeFunc, {
    disableUpdate: true,
    disableRemove: true,
    ...(options ?? {})
  })
}
