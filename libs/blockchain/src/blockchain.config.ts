import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BlockchainExplorer } from './explorer/explorers/blockchain-explorer'
import { BlockScoutExplorer } from './explorer/explorers/blockscount.explorer'
import { EtherScanExplorer } from './explorer/explorers/etherscan.explorer'
import { HarmonyExplorer } from './explorer/explorers/harmony.explorer'
import { ChainId } from './types/ChainId'

interface IBlockchainConfig {
  key: string
  url: string
  explorers: BlockchainExplorer[]
  multicall2Address: string
  maxMulticallSize?: number // TODO
}

export const blockchainConfigList: () => { networks: { [chainId: number]: IBlockchainConfig } } = () => ({
  networks: {
    [ChainId.ARBITRUM]: {
      key: 'arbitrum',
      url: process.env.ARBITRUM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.arbiscan.io/api', process.env.ARBISCAN_KEY!)],
      multicall2Address: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    },
    [ChainId.AVALANCHE]: {
      key: 'avalanche',
      url: process.env.AVALANCHE_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.snowtrace.io/api', process.env.SNOWTRACE_KEY!)],
      multicall2Address: '0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3',
    },
    [ChainId.BSC]: {
      key: 'bsc',
      url: process.env.BSC_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.bscscan.com/api', process.env.BSCSCAN_KEY!)],
      multicall2Address: '0xa9193376D09C7f31283C54e56D013fCF370Cd9D9',
    },
    [ChainId.CELO]: {
      key: 'celo',
      url: process.env.CELO_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://explorer.celo.org/api')],
      multicall2Address: '0x9aac9048fC8139667D6a2597B902865bfdc225d3',
    },
    [ChainId.CRONOS]: {
      key: 'cronos',
      url: process.env.CRONOS_RPC_URL!,
      explorers: [
        new EtherScanExplorer('https://api.cronoscan.com/api', process.env.CRONOSSCAN_KEY!),
        new BlockScoutExplorer('https://cronos.org/explorer/api'),
      ],
      multicall2Address: '0xE41382636a5482EFbBFE575b924527f75C102400',
    },
    [ChainId.ETHEREUM]: {
      key: 'ethereum',
      url: process.env.ETHEREUM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    },
    [ChainId.FANTOM]: {
      key: 'fantom',
      url: process.env.FANTOM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.ftmscan.com/api', process.env.FTMSCAN_KEY!)],
      multicall2Address: '0x22D4cF72C45F8198CfbF4B568dBdB5A85e8DC0B5',
    },
    [ChainId.GNOSIS]: {
      key: 'gnosis',
      url: process.env.GNOSIS_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://blockscout.com/xdai/mainnet/api')],
      multicall2Address: '0x67dA5f2FfaDDfF067AB9d5F025F8810634d84287',
    },
    [ChainId.GOERLI]: {
      key: 'goerli',
      url: process.env.GOERLI_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-goerli.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    },
    [ChainId.HARMONY]: {
      key: 'harmony',
      url: process.env.HARMONY_RPC_URL!,
      explorers: [new HarmonyExplorer('https://ctrver.t.hmny.io/')],
      multicall2Address: '0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3',
    },
    [ChainId.KOVAN]: {
      key: 'kovan',
      url: process.env.KOVAN_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-kovan.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    },
    [ChainId.METIS]: {
      key: 'metis',
      url: process.env.METIS_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://andromeda-explorer.metis.io/api')],
      multicall2Address: '0xc39aBB6c4451089dE48Cffb013c39d3110530e5C',
    },
    [ChainId.OPTIMISM]: {
      key: 'optimism',
      url: process.env.OPTIMISM_RPC_URL!,
      explorers: [
        new EtherScanExplorer('https://api-optimistic.etherscan.io/api', process.env.OPTIMISTIC_ETHERSCAN_KEY!),
      ],
      multicall2Address: '0x04b703d9b6433f84F1ef968462aA3CE52AE89334',
    },
    [ChainId.POLYGON]: {
      key: 'polygon',
      url: process.env.POLYGON_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.polygonscan.com/api', process.env.POLYGONSCAN_KEY!)],
      multicall2Address: '0x02817C1e3543c2d908a590F5dB6bc97f933dB4BD',
    },
    [ChainId.RINKEBY]: {
      key: 'rinkeby',
      url: process.env.RINKEBY_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-rinkeby.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    },
    [ChainId.ROPSTEN]: {
      key: 'ropsten',
      url: process.env.ROPSTEN_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-ropsten.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
    },
    // TODO find multicall address
    // [ChainId.SEPOLIA]: {
    //   key: 'sepolia',
    //   url: process.env.SEPOLIA_RPC_URL!,
    //   explorers: [new EtherScanExplorer('https://api-sepolia.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    // },
  },
})

@Injectable()
export class BlockchainConfigService {
  private static configService: ConfigService

  constructor(private configService: ConfigService) {
    BlockchainConfigService.configService = configService
  }

  get(chainId: ChainId): IBlockchainConfig {
    return this.configService.get('networks')[chainId]
  }

  static get(chainId: ChainId) {
    return BlockchainConfigService.configService.get('networks')[chainId]
  }
}
