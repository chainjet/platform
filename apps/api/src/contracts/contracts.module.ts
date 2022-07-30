import { BlockchainModule } from '@blockchain/blockchain'
import { Module } from '@nestjs/common'
import { ContractResolver } from './resolvers/contract/contract.resolver'

@Module({
  providers: [ContractResolver],
  imports: [BlockchainModule],
})
export class ContractsModule {}
