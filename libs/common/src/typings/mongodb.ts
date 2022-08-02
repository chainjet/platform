import { Schema, Types } from 'mongoose'

// https://github.com/typegoose/typegoose/pull/375
// export declare type Reference<
//   R,
//   T extends RefType = R extends {
//     _id?: RefType
//   }
//     ? NonNullable<R['_id']>
//     : mongoose.Types.ObjectId,
// > = R | T

export type RefType =
  | number
  | string
  | Buffer
  | Types.ObjectId
  | Types.Buffer
  | typeof Schema.Types.Number
  | typeof Schema.Types.String
  | typeof Schema.Types.Buffer
  | typeof Schema.Types.ObjectId

export type Reference<
  PopulatedType,
  RawId extends RefType = PopulatedType extends { _id?: RefType } ? NonNullable<PopulatedType['_id']> : Types.ObjectId,
> = PopulatedType | RawId
