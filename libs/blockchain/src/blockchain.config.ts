import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BlockchainExplorer } from './explorer/explorers/blockchain-explorer'
import { BlockScoutExplorer } from './explorer/explorers/blockscount.explorer'
import { EtherScanExplorer } from './explorer/explorers/etherscan.explorer'
import { HarmonyExplorer } from './explorer/explorers/harmony.explorer'
import { ChainId } from './types/ChainId'

interface IBlockchainConfig {
  key: string
  name: string
  url: string
  explorers: BlockchainExplorer[]
  multicall2Address: string
  maxMulticallSize?: number // TODO
  nativeSymbol: string
}

export const blockchainConfigList: () => { networks: { [key: string]: IBlockchainConfig } } = () => ({
  networks: {
    [ChainId.ARBITRUM]: {
      key: 'arbitrum',
      name: 'Arbitrum',
      url: process.env.ARBITRUM_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'arbiscan.io', apiKey: process.env.ARBISCAN_KEY! })],
      multicall2Address: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
      nativeSymbol: 'ETH',
    },
    [ChainId.AVALANCHE]: {
      key: 'avalanche',
      name: 'Avalanche',
      url: process.env.AVALANCHE_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'snowtrace.io', apiKey: process.env.SNOWTRACE_KEY! })],
      multicall2Address: '0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3',
      nativeSymbol: 'AVAX',
    },
    [ChainId.BSC]: {
      key: 'bsc',
      name: 'BNB Chain (BSC)',
      url: process.env.BSC_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'bscscan.com', apiKey: process.env.BSCSCAN_KEY! })],
      multicall2Address: '0xa9193376D09C7f31283C54e56D013fCF370Cd9D9',
      nativeSymbol: 'BNB',
    },
    [ChainId.CELO]: {
      key: 'celo',
      name: 'Celo',
      url: process.env.CELO_RPC_URL!,
      explorers: [
        new EtherScanExplorer({ baseUrl: 'celoscan.io', apiKey: process.env.CELOSCAN_KEY! }),
        new BlockScoutExplorer({
          baseUrl: 'explorer.celo.org/mainnet',
          apiUrl: 'https://explorer.celo.org/api',
        }),
      ],
      multicall2Address: '0x9aac9048fC8139667D6a2597B902865bfdc225d3',
      nativeSymbol: 'CELO',
    },
    [ChainId.CRONOS]: {
      key: 'cronos',
      name: 'Cronos',
      url: process.env.CRONOS_RPC_URL!,
      explorers: [
        new EtherScanExplorer({ baseUrl: 'cronoscan.com', apiKey: process.env.CRONOSSCAN_KEY! }),
        new BlockScoutExplorer({ baseUrl: 'cronos.org/explorer', apiUrl: 'https://cronos.org/explorer/api' }),
      ],
      multicall2Address: '0xE41382636a5482EFbBFE575b924527f75C102400',
      nativeSymbol: 'CRO',
    },
    [ChainId.ETHEREUM]: {
      key: 'ethereum',
      name: 'Ethereum',
      url: process.env.ETHEREUM_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'etherscan.io', apiKey: process.env.ETHERSCAN_KEY! })],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      nativeSymbol: 'ETH',
    },
    [ChainId.FANTOM]: {
      key: 'fantom',
      name: 'Fantom',
      url: process.env.FANTOM_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'ftmscan.com', apiKey: process.env.FTMSCAN_KEY! })],
      multicall2Address: '0x22D4cF72C45F8198CfbF4B568dBdB5A85e8DC0B5',
      nativeSymbol: 'FTM',
    },
    [ChainId.GNOSIS]: {
      key: 'gnosis',
      name: 'Gnosis',
      url: process.env.GNOSIS_RPC_URL!,
      explorers: [
        new BlockScoutExplorer({
          baseUrl: 'blockscout.com/xdai/mainnet',
          apiUrl: 'https://blockscout.com/xdai/mainnet/api',
        }),
      ],
      multicall2Address: '0x67dA5f2FfaDDfF067AB9d5F025F8810634d84287',
      nativeSymbol: 'xDai',
    },
    [ChainId.GOERLI]: {
      key: 'goerli',
      name: 'Görli',
      url: process.env.GOERLI_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'goerli.etherscan.io',
          apiUrl: 'https://api-goerli.etherscan.io/api',
          apiKey: process.env.ETHERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      nativeSymbol: 'ETH',
    },
    [ChainId.HARMONY]: {
      key: 'harmony',
      name: 'Harmony',
      url: process.env.HARMONY_RPC_URL!,
      explorers: [new HarmonyExplorer({ baseUrl: 'explorer.harmony.one', apiUrl: 'https://ctrver.t.hmny.io/' })],
      multicall2Address: '0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3',
      nativeSymbol: 'ONE',
    },
    [ChainId.KAVA]: {
      key: 'kava',
      name: 'Kava',
      url: process.env.KAVA_RPC_URL!,
      explorers: [new BlockScoutExplorer({ baseUrl: 'explorer.kava.io', apiUrl: 'https://kava4.data.kava.io/api' })],
      multicall2Address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      nativeSymbol: 'KAVA',
    },
    // TODO kovan explorer has been deprecated
    [ChainId.KOVAN]: {
      key: 'kovan',
      name: 'Kovan',
      url: process.env.KOVAN_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'kovan.etherscan.io',
          apiUrl: 'https://api-kovan.etherscan.io/api',
          apiKey: process.env.ETHERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      nativeSymbol: 'ETH',
    },
    [ChainId.METIS]: {
      key: 'metis',
      name: 'Metis',
      url: process.env.METIS_RPC_URL!,
      explorers: [
        new BlockScoutExplorer({
          baseUrl: 'andromeda-explorer.metis.io',
          apiUrl: 'https://andromeda-explorer.metis.io/api',
        }),
      ],
      multicall2Address: '0xc39aBB6c4451089dE48Cffb013c39d3110530e5C',
      nativeSymbol: 'METIS',
    },
    [ChainId.MOONBEAM]: {
      key: 'moonbeam',
      name: 'Moonbeam',
      url: process.env.MOONBEAM_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'moonbeam.moonscan.io',
          apiUrl: 'https://api-moonbeam.moonscan.io/api',
          apiKey: process.env.MOONBEAMSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x34c471ddceb20018bbb73f6d13709936fc870acc',
      nativeSymbol: 'GLMR',
    },
    [ChainId.MOONRIVER]: {
      key: 'moonriver',
      name: 'Moonriver',
      url: process.env.MOONRIVER_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'moonriver.moonscan.io',
          apiUrl: 'https://api-moonriver.moonscan.io/api',
          apiKey: process.env.MOONRIVERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x8C8BF5Dea280A1eC68219D66E8A21E60585830F5',
      nativeSymbol: 'MOVR',
    },
    [ChainId.OPTIMISM]: {
      key: 'optimism',
      name: 'Optimism',
      url: process.env.OPTIMISM_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'optimistic.etherscan.io',
          apiUrl: 'https://api-optimistic.etherscan.io/api',
          apiKey: process.env.OPTIMISTIC_ETHERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x04b703d9b6433f84F1ef968462aA3CE52AE89334',
      nativeSymbol: 'ETH',
    },
    [ChainId.POLYGON]: {
      key: 'polygon',
      name: 'Polygon',
      url: process.env.POLYGON_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'polygonscan.com', apiKey: process.env.POLYGONSCAN_KEY! })],
      multicall2Address: '0x02817C1e3543c2d908a590F5dB6bc97f933dB4BD',
      nativeSymbol: 'MATIC',
    },
    [ChainId.POLYGON_MUMBAI]: {
      key: 'polygon',
      name: 'Polygon Testnet (Mumbai)',
      url: process.env.POLYGON_MUMBAI_RPC_URL!,
      explorers: [new EtherScanExplorer({ baseUrl: 'mumbai.polygonscan.com', apiKey: process.env.POLYGONSCAN_KEY! })],
      multicall2Address: '0x08411ADd0b5AA8ee47563b146743C13b3556c9Cc',
      nativeSymbol: 'MATIC',
    },
    // TODO rinkeby explorer has been deprecated
    [ChainId.RINKEBY]: {
      key: 'rinkeby',
      name: 'Rinkeby',
      url: process.env.RINKEBY_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'rinkeby.etherscan.io',
          apiUrl: 'https://api-rinkeby.etherscan.io/api',
          apiKey: process.env.ETHERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      nativeSymbol: 'ETH',
    },
    // TODO ropsten explorer has been deprecated
    [ChainId.ROPSTEN]: {
      key: 'ropsten',
      name: 'Ropsten',
      url: process.env.ROPSTEN_RPC_URL!,
      explorers: [
        new EtherScanExplorer({
          baseUrl: 'ropsten.etherscan.io',
          apiUrl: 'https://api-ropsten.etherscan.io/api',
          apiKey: process.env.ETHERSCAN_KEY!,
        }),
      ],
      multicall2Address: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
      nativeSymbol: 'ETH',
    },
    // TODO find multicall address
    // [ChainId.SEPOLIA]: {
    //   key: 'sepolia',
    //   url: process.env.SEPOLIA_RPC_URL!,
    //   explorers: [new EtherScanExplorer('https://api-sepolia.etherscan.io/api', process.env.ETHERSCAN_KEY!)],
    // },
    [ChainId.TOMBCHAIN]: {
      key: 'tombchain',
      name: 'Tomb Chain',
      url: process.env.TOMBCHAIN_RPC_URL!,
      explorers: [new BlockScoutExplorer({ baseUrl: 'tombscout.com', apiUrl: 'https://tombscout.com/api' })],
      multicall2Address: '0x9A79912305602863CD4C5facA24BA168f65f7020',
      nativeSymbol: 'TOMB',
    },
  },
})

@Injectable()
export class BlockchainConfigService {
  private static configService: ConfigService
  static instance: BlockchainConfigService

  constructor(private configService: ConfigService) {
    BlockchainConfigService.configService = configService
    BlockchainConfigService.instance = this
  }

  get(chainId: ChainId): IBlockchainConfig {
    return this.configService.get('networks')[chainId]
  }

  static get(chainId: ChainId) {
    return BlockchainConfigService.configService.get('networks')[chainId]
  }
}
