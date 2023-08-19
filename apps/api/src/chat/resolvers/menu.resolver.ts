import { BaseResolver } from '@app/common/base/base.resolver'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { Authorizer, AuthorizerInterceptor, InjectAuthorizer } from '@ptc-org/nestjs-query-graphql'
import { GraphqlGuard } from '../../auth/guards/graphql.guard'
import { CreateMenuInput, Menu, UpdateMenuInput } from '../entities/menu'
import { MenuService } from '../services/menu.service'

@Resolver(() => Menu)
@UseGuards(GraphqlGuard)
@UseInterceptors(AuthorizerInterceptor(Menu))
export class MenuResolver extends BaseResolver(Menu, {
  CreateDTOClass: CreateMenuInput,
  UpdateDTOClass: UpdateMenuInput,
  guards: [GraphqlGuard],
}) {
  constructor(protected menuService: MenuService, @InjectAuthorizer(Menu) readonly authorizer: Authorizer<Menu>) {
    super(menuService)
  }
}
