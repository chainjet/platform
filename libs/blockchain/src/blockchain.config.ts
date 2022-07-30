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
}

export const blockchainConfigList: () => { networks: { [chainId: number]: IBlockchainConfig } } = () => ({
  networks: {
    [ChainId.ARBITRUM]: {
      key: 'arbitrum',
      url: process.env.ARBITRUM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.arbiscan.io/api', process.env.ARBISCAN_KEY!)],
    },
    [ChainId.AVALANCHE]: {
      key: 'avalanche',
      url: process.env.AVALANCHE_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.snowtrace.io/api', process.env.SNOWTRACE_KEY!)],
    },
    [ChainId.BSC]: {
      key: 'bsc',
      url: process.env.BSC_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.bscscan.com/api', process.env.BSCSCAN_KEY!)],
    },
    [ChainId.CELO]: {
      key: 'celo',
      url: process.env.CELO_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://explorer.celo.org/api')],
    },
    [ChainId.CRONOS]: {
      key: 'cronos',
      url: process.env.CRONOS_RPC_URL!,
      explorers: [
        new EtherScanExplorer('https://api.cronoscan.com/api', process.env.CRONOSSCAN_KEY!),
        new BlockScoutExplorer('https://cronos.org/explorer/api'),
      ],
    },
    [ChainId.ETHEREUM]: {
      key: 'ethereum',
      url: process.env.ETHEREUM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
    [ChainId.FANTOM]: {
      key: 'fantom',
      url: process.env.FANTOM_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.ftmscan.com/api', process.env.FTMSCAN_KEY!)],
    },
    [ChainId.GNOSIS]: {
      key: 'gnosis',
      url: process.env.GNOSIS_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://blockscout.com/xdai/mainnet/api')],
    },
    [ChainId.GÖRLI]: {
      key: 'gorli',
      url: process.env.GORLI_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-goerli.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
    [ChainId.HARMONY]: {
      key: 'harmony',
      url: process.env.HARMONY_RPC_URL!,
      explorers: [new HarmonyExplorer('https://ctrver.t.hmny.io/')],
    },
    [ChainId.KOVAN]: {
      key: 'kovan',
      url: process.env.KOVAN_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-kovan.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
    [ChainId.METIS]: {
      key: 'metis',
      url: process.env.METIS_RPC_URL!,
      explorers: [new BlockScoutExplorer('https://andromeda-explorer.metis.io/api')],
    },
    [ChainId.OPTIMISM]: {
      key: 'optimism',
      url: process.env.OPTIMISM_RPC_URL!,
      explorers: [
        new EtherScanExplorer('https://api-optimistic.etherscan.io/api', process.env.OPTIMISTIC_ETHERSCAN_KEY!),
      ],
    },
    [ChainId.POLYGON]: {
      key: 'polygon',
      url: process.env.POLYGON_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api.polygonscan.com/api', process.env.POLYGONSCAN_KEY!)],
    },
    [ChainId.RINKEBY]: {
      key: 'rinkeby',
      url: process.env.RINKEBY_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-rinkeby.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
    [ChainId.ROPSTEN]: {
      key: 'ropsten',
      url: process.env.ROPSTEN_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-ropsten.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
    [ChainId.SEPOLIA]: {
      key: 'sepolia',
      url: process.env.SEPOLIA_RPC_URL!,
      explorers: [new EtherScanExplorer('https://api-sepolia.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    },
  },
})

@Injectable()
export class BlockchainConfig {
  private static configService: ConfigService

  constructor(private configService: ConfigService) {
    BlockchainConfig.configService = configService
  }

  get(chainId: ChainId) {
    return this.configService.get('networks')[chainId]
  }

  static get(chainId: ChainId) {
    return BlockchainConfig.configService.get('networks')[chainId]
  }
}
