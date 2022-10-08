import { Contract } from 'ethers'
import { ethers, upgrades } from 'hardhat'

export async function deployUpgradeableContract<T extends Contract>(
  contractName: string,
  proxyAddress?: string,
  initializeArgs: any[] = [],
): Promise<T> {
  const ContractFactory = await ethers.getContractFactory(contractName)

  let proxy: T
  if (proxyAddress) {
    proxy = (await upgrades.upgradeProxy(proxyAddress, ContractFactory, { timeout: 1000 * 60 * 60 })) as T
  } else {
    proxy = (await upgrades.deployProxy(ContractFactory, initializeArgs, { timeout: 1000 * 60 * 60 })) as T
  }

  await proxy.deployed()
  console.log(`${contractName} deployed to:`, proxy.address)

  return proxy
}
