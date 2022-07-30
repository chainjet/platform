import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { abiToInputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { Args, Field, ID, Int, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { MethodAbi } from 'ethereum-types'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'

@ObjectType('ContractSchema')
export class ContractSchemaDto {
  @Field((type) => ID)
  id: string

  @Field((type) => Int)
  chainId: number

  @Field((type) => GraphQLString)
  address: string

  @Field((type) => GraphQLJSONObject)
  schema: string
}

@Resolver('Contract')
export class ContractResolver {
  constructor(private explorerService: ExplorerService) {}

  @Query(() => ContractSchemaDto)
  async contractSchema(
    @Args('chainId', { type: () => Int }) chainId: number,
    @Args('address', { type: () => GraphQLString }) address: string,
  ) {
    const abi = await this.explorerService.getContractAbi(chainId, address)
    if (!abi) {
      throw new Error(`No abi found for contract ${address}`)
    }

    const viewMethods = abi.filter(
      (def: MethodAbi) => def.type === 'function' && ['view', 'pure'].includes(def.stateMutability),
    ) as MethodAbi[]

    const schema = abiToInputJsonSchema(viewMethods)

    return {
      id: `${chainId}-${address}`,
      chainId,
      address,
      schema,
    }
  }
}
