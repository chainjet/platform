import { BaseEntity } from '@app/common/base/base-entity'
import { jsonProp } from '@app/common/decorators/props/json-prop.decorator'
import { ObjectType } from '@nestjs/graphql'
import { Index, prop } from '@typegoose/typegoose'
import { ContractAbi } from 'ethereum-types'

@ObjectType()
@Index({ chainId: 1, address: 1 }, { unique: true })
export class EvmContract extends BaseEntity {
  @prop({ required: true })
  readonly chainId: number

  @prop({ required: true })
  readonly address: string

  @jsonProp({ required: true })
  abi: ContractAbi
}
