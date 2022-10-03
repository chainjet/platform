import '@nomicfoundation/hardhat-toolbox'
import { HardhatUserConfig } from 'hardhat/config'
import { ChainId } from './libs/blockchain/src/types/ChainId'
require('dotenv').config()

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  networks: {
    ethereum: {
      chainId: ChainId.ETHEREUM,
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV!],
    },
    goerli: {
      chainId: ChainId.GOERLI,
      url: process.env.GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV!],
    },
    polygon: {
      chainId: ChainId.POLYGON,
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV!],
    },
  },
}

export default config
