import { ArgsType, Field } from '@nestjs/graphql'
import {
  Assembler,
  AssemblerQueryService,
  Class,
  DeepPartial,
  DefaultAssembler,
  QueryService,
} from '@ptc-org/nestjs-query-core'
import { getAssemblerDeserializer } from '@ptc-org/nestjs-query-core/src/assemblers/assembler.deserializer'
import {
  CRUDResolver,
  CRUDResolverOpts,
  PagingStrategies,
  QueryArgsType,
  ReadResolverOpts,
} from '@ptc-org/nestjs-query-graphql'
import { MergePagingStrategyOpts, ResolverClass } from '@ptc-org/nestjs-query-graphql/src/resolvers/resolver.interface'
import { StaticQueryType } from '@ptc-org/nestjs-query-graphql/src/types/query'
import { plainToClass } from 'class-transformer'
import { ObjectId } from 'mongodb'

/**
 * Assemblers are used to transform plain object <=> class instance.
 * plainToClass has an issue that changes the value of object ids (https://github.com/typestack/class-transformer/issues/494)
 * This workaround checks if the entity is already an instance, and returns it if so.
 */
export class DefaultEntityAssembler<DTO, Entity> extends DefaultAssembler<DTO, Entity> {
  convert<T>(cls: Class<T>, obj: object): T {
    const deserializer = getAssemblerDeserializer(cls)
    if (deserializer) {
      return deserializer(obj)
    }

    if ((obj as any)._id instanceof ObjectId) {
      return obj as unknown as T
    }

    return plainToClass(cls, obj)
  }
}

/**
 * Replaces the default assembler
 * See description of DefaultEntityAssembler
 */
function getEntityAssembler<From, To, C = DeepPartial<From>, CE = DeepPartial<To>, U = C, UE = CE>(
  FromClass: Class<From>,
  ToClass: Class<To>,
): Assembler<From, To, C, CE, U, UE> {
  const defaultAssember = new DefaultEntityAssembler(FromClass, ToClass)
  // if its a default just assume the types can be converted for all types
  return defaultAssember as unknown as Assembler<From, To, C, CE, U, UE>
}

const getResolverToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}AutoResolver`

export function SearchableQueryArgsType<DTO>(DTOClass: Class<DTO>): StaticQueryType<DTO, PagingStrategies.CURSOR> {
  @ArgsType()
  class QueryArgsTypeWithSearch extends QueryArgsType(DTOClass) {
    @Field({ nullable: true })
    search?: string
  }

  return QueryArgsTypeWithSearch
}

export const BaseResolver = <
  DTO,
  C extends DeepPartial<DTO> = DeepPartial<DTO>,
  U extends DeepPartial<DTO> = DeepPartial<DTO>,
  R extends ReadResolverOpts<DTO> = ReadResolverOpts<DTO>,
  PS extends PagingStrategies = PagingStrategies.CURSOR,
>(
  DTOClass: Class<DTO>,
  opts: CRUDResolverOpts<DTO, C, U, R, PS> = {},
): ResolverClass<DTO, QueryService<DTO>, CRUDResolver<DTO, C, U, MergePagingStrategyOpts<DTO, R, PS>>> => {
  // const { baseNameLower, pluralBaseNameLower, baseName } = getDTONames(DTOClass, opts.read);

  // disable all many mutations by default
  opts.create = opts.create ?? {}
  if (opts.create.many?.disabled !== false) {
    opts.create.many = { disabled: true }
  }
  opts.update = opts.update ?? {}
  if (!opts.update.many?.disabled !== false) {
    opts.update.many = { disabled: true }
  }
  opts.delete = opts.delete ?? {}
  if (!opts.delete.many?.disabled !== false) {
    opts.delete.many = { disabled: true }
  }

  // create default assembler service
  class Service extends AssemblerQueryService<DTO, DTO> {
    constructor(service: QueryService<DTO>) {
      const assembler = getEntityAssembler(DTOClass, DTOClass)
      super(assembler, service)
    }
  }

  class CustomResolver extends CRUDResolver(DTOClass, opts) {
    constructor(service: QueryService<DTO>) {
      super(new Service(service))
    }
  }

  // need to set class name so DI works properly
  Object.defineProperty(CustomResolver, 'name', { value: getResolverToken(DTOClass), writable: false })

  return CustomResolver
}
