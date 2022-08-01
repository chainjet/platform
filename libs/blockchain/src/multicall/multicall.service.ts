import { Injectable } from '@nestjs/common'
import { ethers, providers, Wallet } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import _ from 'lodash'
import { BlockchainConfigService } from '../blockchain.config'
import { ProviderService } from '../provider/provider.service'
import { ChainId } from '../types/ChainId'
import MULTICALL_ABI from './multicall.abi.json'

export interface CallSingleContract {
  address: string
  name: string
  params?: any[]
}

export interface CallManyContracts {
  abi: any[]
  address: string
  name: string
  params?: any[]
}

export interface CallWithResolve<T> {
  calls: CallManyContracts[]
  resolve: (res: any) => T
}

type MulticallTryAggregateRes = Array<{
  success: boolean
  returnData: string
}>

interface MulticallOptions {
  requireSuccess?: boolean
}

@Injectable()
export class MulticallService {
  static instance: MulticallService

  constructor(private providerService: ProviderService, private blockchainConfigService: BlockchainConfigService) {
    MulticallService.instance = this
  }

  async callOneContract(
    chainId: ChainId,
    abi: any[],
    calls: CallSingleContract[],
    { requireSuccess = true }: MulticallOptions = {},
  ) {
    const chunkSize = this.blockchainConfigService.get(chainId)?.maxMulticallSize
    const callChuncks = chunkSize ? _.chunk(calls, chunkSize) : [calls]
    const res: ethers.utils.Result[] = []
    for (const chunk of callChuncks) {
      const chunkRes = (await this.executeMulticallOneContract(chainId, abi, chunk, { requireSuccess })).filter(
        (r) => r !== null,
      ) as ethers.utils.Result[]
      res.push(...chunkRes)
    }
    return res
  }

  private async executeMulticallOneContract(
    chainId: ChainId,
    abi: any[],
    calls: CallSingleContract[],
    { requireSuccess = true }: MulticallOptions = {},
  ) {
    const multicall = this.getMulticallContract(chainId)
    const itf = new Interface(abi)
    const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])
    const results: MulticallTryAggregateRes = await multicall.callStatic.tryAggregate(requireSuccess, calldata)
    return results.map(({ success, returnData }, i) => {
      try {
        return success ? itf.decodeFunctionResult(calls[i].name, returnData) : null
      } catch (e) {
        if (requireSuccess) {
          throw e
        }
        return null
      }
    })
  }

  async callManyContracts(
    chainId: ChainId,
    calls: CallManyContracts[],
    { requireSuccess = true }: MulticallOptions = {},
  ) {
    const chunkSize = this.blockchainConfigService.get(chainId)?.maxMulticallSize
    const callChuncks = chunkSize ? _.chunk(calls, chunkSize) : [calls]
    const res: ethers.utils.Result[] = []
    for (const chunk of callChuncks) {
      const chunkRes = (await this.executeMulticallManyContracts(chainId, chunk, { requireSuccess })).filter(
        (r) => r !== null,
      ) as ethers.utils.Result[]
      res.push(...chunkRes)
    }
    return res
  }

  private async executeMulticallManyContracts(
    chainId: ChainId,
    calls: CallManyContracts[],
    { requireSuccess = true }: MulticallOptions = {},
  ) {
    const multicall = this.getMulticallContract(chainId)
    const callsWithInterface = calls.map((call) => ({ ...call, itf: new Interface(call.abi) }))
    const calldata = callsWithInterface.map((call) => [
      call.address.toLowerCase(),
      call.itf.encodeFunctionData(call.name, call.params),
    ])
    const results: MulticallTryAggregateRes = await multicall.callStatic.tryAggregate(requireSuccess, calldata)
    return results.map(({ success, returnData }, i) => {
      try {
        return success ? callsWithInterface[i].itf.decodeFunctionResult(callsWithInterface[i].name, returnData) : null
      } catch (e) {
        if (requireSuccess) {
          throw e
        }
        return null
      }
    })
  }

  async callAndResolve<T>(
    chainId: ChainId,
    callsWithResolve: CallWithResolve<T>[],
    options: MulticallOptions = {},
  ): Promise<T[]> {
    const calls: CallManyContracts[] = callsWithResolve.reduce((prev, curr) => {
      return [...prev, ...curr.calls]
    }, [])
    const responses = await this.callManyContracts(chainId, calls, options)
    const data = callsWithResolve.reduce(
      (prev, { calls, resolve }) => {
        const res = prev.responses.slice(0, calls.length)
        return {
          responses: prev.responses.slice(calls.length),
          resolved: [...prev.resolved, resolve(res)],
        }
      },
      { responses, resolved: [] },
    )
    return data.resolved
  }

  private getMulticallContract(
    chainId: ChainId,
    provider: Wallet | providers.JsonRpcProvider = this.providerService.getReadOnlyProvider(chainId),
  ) {
    return new ethers.Contract(this.blockchainConfigService.get(chainId).multicall2Address, MULTICALL_ABI, provider)
  }
}
