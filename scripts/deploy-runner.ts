import { network } from 'hardhat'
import { CHAINJET_RUNNER_ADDRESS } from '../libs/blockchain/src/constants'
import { deployUpgradeableContract } from './deploy.utils'

async function main() {
  if (!network.config.chainId) {
    throw new Error('ChainId is required')
  }
  await deployUpgradeableContract('ChainJetRunner', CHAINJET_RUNNER_ADDRESS[network.config.chainId])
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
