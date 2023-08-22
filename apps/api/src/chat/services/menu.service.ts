import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { User } from '../../users/entities/user'
import { Menu } from '../entities/menu'

@Injectable()
export class MenuService extends BaseService<Menu> {
  protected readonly logger = new Logger(MenuService.name)
  static instance: MenuService

  constructor(@InjectModel(Menu) protected readonly model: ReturnModelType<typeof Menu>) {
    super(model)
    MenuService.instance = this
  }

  async resolveMenu(id: string, menuOwner: User) {
    const menu = await this.findOne({ _id: id, owner: menuOwner })
    if (!menu) {
      return ''
    }
    return menu.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.name}${menu.currency && item.price ? ` (${item.price} ${menu.currency})` : ''}`,
      )
      .join('\n')
  }
}
