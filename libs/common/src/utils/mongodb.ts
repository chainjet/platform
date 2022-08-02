import { DynamicModule } from '@nestjs/common'
import { mongoose } from '@typegoose/typegoose'
import { TypegooseModule } from 'nestjs-typegoose'

export const ObjectID = mongoose.Types.ObjectId

export const mongoForRoot = (): DynamicModule => {
  return TypegooseModule.forRoot(process.env.MONGO_URI as string, {
    // useFindAndModify: false,
    // useNewUrlParser: true
  })
}
