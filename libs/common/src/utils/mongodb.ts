import { DynamicModule } from '@nestjs/common'
import { mongoose } from '@typegoose/typegoose'
import { ObjectId } from 'mongodb'
import { TypegooseModule } from 'nestjs-typegoose'

export const ObjectID = mongoose.Types.ObjectId

export const mongoForRoot = (): DynamicModule => {
  return TypegooseModule.forRoot(process.env.MONGO_URI as string, {
    // useFindAndModify: false,
    // useNewUrlParser: true
  })
}

export function getDateFromObjectId(objectId: ObjectId): Date {
  return new Date(parseInt(objectId.toString().slice(0, 8), 16) * 1000)
}
