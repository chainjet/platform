import { Module } from '@nestjs/common'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { TypegooseModule } from 'nestjs-typegoose'

let mongod: MongoMemoryServer

@Module({
  imports: [
    TypegooseModule.forRootAsync({
      useFactory: async () => {
        mongod = new MongoMemoryServer()
        return {
          uri: await mongod.getUri(),
          useNewUrlParser: true,
          useFindAndModify: false,
          useUnifiedTopology: true,
        }
      },
    }),
  ],
})
export class TestDatabaseModule {}

export const closeMongoConnection = async (): Promise<void> => {
  if (mongod) {
    await mongod.stop()
  }
}
