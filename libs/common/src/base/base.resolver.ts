import { AssemblerFactory, AssemblerQueryService, Class, DeepPartial, QueryService } from '@nestjs-query/core'
import {
  CRUDResolver,
  CRUDResolverOpts,
  PagingStrategies,
  QueryArgsType,
  ReadResolverOpts,
  StaticQueryArgsType,
} from '@nestjs-query/query-graphql'
import {
  MergePagingStrategyOpts,
  ResolverClass,
} from '@nestjs-query/query-graphql/dist/src/resolvers/resolver.interface'
import { ArgsType, Field } from '@nestjs/graphql'

const getResolverToken = <DTO>(DTOClass: Class<DTO>): string => `${DTOClass.name}AutoResolver`

export function SearchableQueryArgsType<DTO>(DTOClass: Class<DTO>): StaticQueryArgsType<DTO> {
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
): ResolverClass<DTO, CRUDResolver<DTO, C, U, MergePagingStrategyOpts<DTO, R, PS>>> => {
  // const { baseNameLower, pluralBaseNameLower, baseName } = getDTONames(DTOClass, opts.read);

  // create default assembler service
  class Service extends AssemblerQueryService<DTO, DTO> {
    constructor(service: QueryService<DTO>) {
      const assembler = AssemblerFactory.getAssembler(DTOClass, DTOClass)
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
