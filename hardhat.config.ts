import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'
import { ChainId } from './libs/blockchain/src/types/ChainId'
require('dotenv').config()

module.exports = {
  solidity: '0.8.17',
  networks: {
    ...(process.env.PRIVATE_KEY_DEV
      ? {
          ethereum: {
            chainId: ChainId.ETHEREUM,
            url: process.env.ETHEREUM_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_DEV],
          },
          goerli: {
            chainId: ChainId.GOERLI,
            url: process.env.GOERLI_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_DEV],
          },
          polygon: {
            chainId: ChainId.POLYGON,
            url: process.env.POLYGON_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_DEV],
          },
        }
      : {}),
  },
  etherscan: {
    apiKey: {
      ethereum: process.env.ETHERSCAN_KEY,
      goerli: process.env.ETHERSCAN_KEY,
      polygon: process.env.POLYGONSCAN_KEY,
    },
  },
  paths: {
    sources: './contracts',
    tests: './test-contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
}
