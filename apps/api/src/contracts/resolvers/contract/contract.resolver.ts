import { ExplorerService } from '@blockchain/blockchain/explorer/explorer.service'
import { eventsAbiToInputJsonSchema, methodsAbiToInputJsonSchema } from '@blockchain/blockchain/utils/abi.utils'
import { Args, Field, ID, Int, ObjectType, Query, Resolver } from '@nestjs/graphql'
import { EventAbi, MethodAbi } from 'ethereum-types'
import { GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-type-json'
import { JSONSchema7 } from 'json-schema'

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
    @Args('type', { type: () => GraphQLString }) type: string,
  ) {
    const abi = await this.explorerService.getContractAbi(chainId, address)
    if (!abi) {
      throw new Error(`No abi found for contract ${address}`)
    }

    let schema: JSONSchema7

    switch (type) {
      case 'read-methods':
        const viewMethods = abi.filter(
          (def: MethodAbi) => def.type === 'function' && ['view', 'pure'].includes(def.stateMutability),
        ) as MethodAbi[]
        schema = methodsAbiToInputJsonSchema(viewMethods)
        break
      case 'events':
        const events = abi.filter((def) => def.type === 'event') as EventAbi[]
        schema = eventsAbiToInputJsonSchema(events)
        break
      default:
        throw new Error(`Invalid type`)
    }

    return {
      id: `${chainId}-${address}`,
      chainId,
      address,
      schema,
    }
  }
}
