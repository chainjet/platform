import { ContractAbi } from 'ethereum-types'

export abstract class BlockchainExplorer {
  abstract getAbi(address: string): Promise<ContractAbi>
  abstract getTransactionUrl(txHash: string): string
}
