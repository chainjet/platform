import { Injectable } from '@nestjs/common'
import { UserService } from 'apps/api/src/users/services/user.service'

@Injectable()
export class Migration0001 {
  constructor(private userService: UserService) {}

  async run() {
    const users = await this.userService.find({})
    for (const user of users) {
      user.iUsername = user.username.toLowerCase()
      await this.userService.updateOne(user.id, user)
    }
  }
}
