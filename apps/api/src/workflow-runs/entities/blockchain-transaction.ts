import { ChainId } from '@blockchain/blockchain/types/ChainId'
import { Field, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class BlockchainTransaction {
  @Field(() => Number)
  chainId: ChainId

  @Field()
  hash: string
}
