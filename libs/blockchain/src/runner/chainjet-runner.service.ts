import { Injectable } from '@nestjs/common'
import { ContractTransaction, ethers, providers, Wallet } from 'ethers'
import { CHAINJET_RUNNER_ADDRESS } from '../constants'
import { ProviderService } from '../provider/provider.service'
import { ChainId } from '../types/ChainId'
import CHAINJET_RUNNER_ABI from './chainjet-runner.abi.json'

@Injectable()
export class ChainJetRunnerService {
  constructor(private providerService: ProviderService) {}

  runTask(chainId: ChainId, taskAddress: string, data: any[]): Promise<ContractTransaction> {
    const gasLimit = 8000000
    const provider = this.providerService.getSignedProvider(chainId, process.env.PRIVATE_KEY_RUNNER!)
    const taskContract = new ethers.Contract(
      taskAddress,
      [
        {
          inputs: [],
          name: 'run',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      provider,
    )
    const calldata = taskContract.interface.encodeFunctionData('run', data)
    return this.getContract(chainId, provider).run(taskAddress, calldata, gasLimit, { gasLimit })
  }

  private getContract(
    chainId: ChainId,
    provider: Wallet | providers.JsonRpcProvider = this.providerService.getReadOnlyProvider(chainId),
  ) {
    return new ethers.Contract(CHAINJET_RUNNER_ADDRESS[chainId], CHAINJET_RUNNER_ABI, provider)
  }
}
