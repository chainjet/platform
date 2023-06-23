import { UserDatabaseItemService } from 'apps/api/src/user-database/services/user-database-item.service'
import { UserDatabaseService } from 'apps/api/src/user-database/services/user-database.service'

interface ClientOptions {
  user: {
    id: string
  }
}

export class StorageClient {
  private userId: string

  constructor({ user }: ClientOptions) {
    this.userId = user.id
  }

  async get(databaseKey: string, itemKey: string): Promise<{ id: string; value: any } | null> {
    const database = await UserDatabaseService.instance.findOne({
      owner: this.userId,
      key: databaseKey,
    })
    if (!database) {
      return null
    }
    const item = await UserDatabaseItemService.instance.findOne({
      owner: this.userId,
      database: database._id,
      key: itemKey,
    })
    if (!item) {
      return null
    }
    return {
      id: item._id.toString(),
      value: item.value,
    }
  }

  async set(databaseKey: string, itemKey: string, value: any): Promise<{ id: string }> {
    let database = await UserDatabaseService.instance.findOne({
      owner: this.userId,
      key: databaseKey,
    })
    if (!database) {
      database = await UserDatabaseService.instance.createOne({
        owner: this.userId as any,
        key: databaseKey,
      })
    }
    const item = await UserDatabaseItemService.instance.createOrUpdateOne(
      { owner: this.userId, database: database._id, key: itemKey },
      {
        owner: this.userId as any,
        database: database._id,
        key: itemKey,
        value,
      },
    )
    return {
      id: item._id.toString(),
    }
  }
}
