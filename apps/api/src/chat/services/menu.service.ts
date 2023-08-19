import { BaseService } from '@app/common/base/base.service'
import { Injectable, Logger } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { InjectModel } from 'nestjs-typegoose'
import { Menu } from '../entities/menu'

@Injectable()
export class MenuService extends BaseService<Menu> {
  protected readonly logger = new Logger(MenuService.name)

  constructor(@InjectModel(Menu) protected readonly model: ReturnModelType<typeof Menu>) {
    super(model)
  }

  // async createOne(record: Partial<Menu>): Promise<Menu> {
  //   return super.createOne(record)
  // }
}
