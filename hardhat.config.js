require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

module.exports = {
  solidity: '0.8.17',
  networks: {
    ethereum: {
      chainId: 1,
      url: process.env.ETHEREUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV],
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV],
    },
    polygon: {
      chainId: 137,
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY_DEV],
    },
  },
  paths: {
    sources: './contracts',
    tests: './test-contracts',
    cache: './cache',
    artifacts: './artifacts',
  },
}
