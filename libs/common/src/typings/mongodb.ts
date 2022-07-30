import { mongoose } from '@typegoose/typegoose'

// https://github.com/typegoose/typegoose/pull/375
export declare type RefType = number | string | Buffer | undefined | mongoose.Types.ObjectId | mongoose.Types.Buffer | typeof mongoose.Schema.Types.Number | typeof mongoose.Schema.Types.String | typeof mongoose.Schema.Types.Buffer | typeof mongoose.Schema.Types.ObjectId
export declare type Reference<R, T extends RefType = R extends {
  _id?: RefType
} ? NonNullable<R['_id']> : mongoose.Types.ObjectId> = R | T
