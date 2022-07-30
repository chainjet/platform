import { ContractAbi } from 'ethereum-types'

export abstract class BlockchainExplorer {
  abstract getAbi(address: string): Promise<ContractAbi>
}
