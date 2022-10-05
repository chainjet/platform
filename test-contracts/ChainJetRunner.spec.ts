import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { parseUnits } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { ChainJetRunner, TaskMock } from 'typechain-types'
import { LongTaskMock } from 'typechain-types/contracts/mocks/LongTaskMock'
import { ZERO_ADDRESS } from '../libs/blockchain/src/constants'

describe('ChainJetRunner', () => {
  let deployer: SignerWithAddress
  let alice: SignerWithAddress
  let bob: SignerWithAddress
  let carol: SignerWithAddress
  let dev: SignerWithAddress
  let eve: SignerWithAddress

  beforeEach(async () => {
    ;[deployer, alice, bob, carol, dev, eve] = await ethers.getSigners()
  })

  const deployChainJetRunner = async (): Promise<ChainJetRunner> => {
    const ChainJetRunner = await ethers.getContractFactory('ChainJetRunner')
    const chainJetRunner = await ChainJetRunner.deploy()
    await chainJetRunner.deployed()
    await chainJetRunner.initialize()
    await chainJetRunner.setWhitelist(dev.address, true)
    return chainJetRunner
  }

  const deployTaskMock = async (account: SignerWithAddress): Promise<TaskMock> => {
    const TaskMock = await ethers.getContractFactory('TaskMock')
    const taskMock = await TaskMock.connect(account).deploy()
    await taskMock.deployed()
    return taskMock as TaskMock
  }

  const deployLongTaskMock = async (account: SignerWithAddress): Promise<LongTaskMock> => {
    const TaskMock = await ethers.getContractFactory('LongTaskMock')
    const taskMock = await TaskMock.connect(account).deploy()
    await taskMock.deployed()
    return taskMock as LongTaskMock
  }

  describe('initialize', () => {
    it('should set the correct state variables', async () => {
      const chainJetRunner = await deployChainJetRunner()
      expect(await chainJetRunner.owner()).to.eq(deployer.address)
      expect(await chainJetRunner.whitelist(deployer.address)).to.eq(true)
    })
  })

  describe('enableTask', () => {
    it('should enable a task', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })

      const taskEnabled = await chainJetRunner.tasks(taskMock.address)
      expect(taskEnabled[0]).to.eq(taskMock.address)
      expect(taskEnabled[1]).to.eq(alice.address)
    })

    it('should enable a task with existent balance', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).deposit({ value: parseUnits('1') })
      await chainJetRunner.connect(alice).enableTask(taskMock.address)

      const taskEnabled = await chainJetRunner.tasks(taskMock.address)
      expect(taskEnabled[0]).to.eq(taskMock.address)
      expect(taskEnabled[1]).to.eq(alice.address)
    })

    it('should revert if caller is not the owner', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)

      await expect(
        chainJetRunner.connect(eve).enableTask(taskMock.address, { value: parseUnits('1') }),
      ).to.be.revertedWith('enableTask: caller is not the owner')
    })

    it('should revert if the task is already enabled', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(carol)
      await chainJetRunner.connect(carol).enableTask(taskMock.address, { value: parseUnits('1') })

      await expect(
        chainJetRunner.connect(carol).enableTask(taskMock.address, { value: parseUnits('1') }),
      ).to.revertedWith('enableTask: task already enabled')
    })

    it('should revert if the caller has no balance', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(carol)

      await expect(chainJetRunner.connect(carol).enableTask(taskMock.address)).to.be.revertedWith(
        'enableTask: no balance',
      )
    })
  })

  describe('disableTask', () => {
    it('should disable a task', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })
      await chainJetRunner.connect(alice).disableTask(taskMock.address)

      const taskEnabled = await chainJetRunner.tasks(taskMock.address)
      expect(taskEnabled[0]).to.eq(ZERO_ADDRESS)
      expect(taskEnabled[1]).to.eq(ZERO_ADDRESS)
    })

    it('should revert if caller is not the owner', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })

      await expect(chainJetRunner.connect(eve).disableTask(taskMock.address)).to.be.revertedWith(
        'disableTask: caller is not the owner',
      )
    })

    it('should revert if the task is not enabled', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(carol)

      await expect(chainJetRunner.connect(carol).disableTask(taskMock.address)).to.be.revertedWith(
        'disableTask: task not enabled',
      )
    })
  })

  describe('deposit', () => {
    it('should increase depositor balance', async () => {
      const chainJetRunner = await deployChainJetRunner()
      await chainJetRunner.connect(alice).deposit({ value: parseUnits('1') })
      await chainJetRunner.connect(bob).deposit({ value: parseUnits('2') })
      await chainJetRunner.connect(bob).deposit({ value: parseUnits('3') })
      await chainJetRunner.connect(carol).deposit({ value: parseUnits('0') })

      const balanceAlice = await chainJetRunner.balances(alice.address)
      const balanceBob = await chainJetRunner.balances(bob.address)
      const balanceCarol = await chainJetRunner.balances(carol.address)
      expect(balanceAlice).to.eq(parseUnits('1'))
      expect(balanceBob).to.eq(parseUnits('5'))
      expect(balanceCarol).to.eq(parseUnits('0'))
    })
  })

  describe('withdraw', () => {
    it('should decrease depositor balance', async () => {
      const chainJetRunner = await deployChainJetRunner()
      await chainJetRunner.connect(alice).deposit({ value: parseUnits('1') })
      await chainJetRunner.connect(alice).withdraw(parseUnits('1'))
      await chainJetRunner.connect(bob).deposit({ value: parseUnits('5') })
      await chainJetRunner.connect(bob).withdraw(parseUnits('2'))
      await chainJetRunner.connect(carol).deposit({ value: parseUnits('0') })
      await chainJetRunner.connect(carol).withdraw(parseUnits('0'))

      const balanceAlice = await chainJetRunner.balances(alice.address)
      const balanceBob = await chainJetRunner.balances(bob.address)
      const balanceCarol = await chainJetRunner.balances(carol.address)
      expect(balanceAlice).to.eq(parseUnits('0'))
      expect(balanceBob).to.eq(parseUnits('3'))
      expect(balanceCarol).to.eq(parseUnits('0'))
    })

    it('should revert if caller has no balance', async () => {
      const chainJetRunner = await deployChainJetRunner()

      await expect(chainJetRunner.connect(eve).withdraw(parseUnits('1'))).to.be.revertedWith(
        'withdraw: insufficient balance',
      )
    })

    it('should revert if caller has insufficient balance', async () => {
      const chainJetRunner = await deployChainJetRunner()
      await chainJetRunner.connect(eve).deposit({ value: parseUnits('1') })

      await expect(chainJetRunner.connect(eve).withdraw(parseUnits('2'))).to.be.revertedWith(
        'withdraw: insufficient balance',
      )
    })
  })

  describe('run', () => {
    const gasLimit = 30000000

    it('should get the gas overhead', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const originalGasOverhead = await chainJetRunner.gasOverhead()
      await chainJetRunner.setGasOverhead(0)
      const taskMock = await deployLongTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })
      const calldata = taskMock.interface.encodeFunctionData('run', [0, 100])

      const deployerBalanceBefore = await deployer.getBalance()
      const tx = await chainJetRunner.run(taskMock.address, calldata, gasLimit, { gasLimit })
      const receipt = await tx.wait()
      const { effectiveGasPrice } = receipt

      const deployerBalanceAfter = await deployer.getBalance()
      expect(originalGasOverhead).to.eq(deployerBalanceBefore.sub(deployerBalanceAfter).div(effectiveGasPrice))
    })

    it('should run a task', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })
      const calldata = taskMock.interface.encodeFunctionData('run', [2])

      const devBalanceBefore = await dev.getBalance()
      const tx = await chainJetRunner.connect(dev).run(taskMock.address, calldata, gasLimit, { gasLimit })

      expect(await dev.getBalance()).to.eq(devBalanceBefore)
      const resolvedTx = await tx.wait()
      const { gasUsed, effectiveGasPrice } = resolvedTx
      const totalGas = gasUsed.mul(effectiveGasPrice)
      expect(await taskMock.counter()).to.eq(2)
      expect(await chainJetRunner.balances(alice.address)).to.eq(parseUnits('1').sub(totalGas))
    })

    it('should run a long task', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployLongTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: parseUnits('1') })
      const calldata = taskMock.interface.encodeFunctionData('run', [0, 100])

      const devBalanceBefore = await dev.getBalance()
      const tx = await chainJetRunner.connect(dev).run(taskMock.address, calldata, gasLimit, { gasLimit })

      expect(await dev.getBalance()).to.eq(devBalanceBefore)
      const receipt = await tx.wait()
      const { gasUsed, effectiveGasPrice } = receipt
      const totalGas = gasUsed.mul(effectiveGasPrice)
      expect(await taskMock.counter()).to.eq(100)
      expect(await chainJetRunner.balances(alice.address)).to.eq(parseUnits('1').sub(totalGas))
    })

    it('should revert if task is not enabled', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      const calldata = taskMock.interface.encodeFunctionData('run', [2])

      await expect(chainJetRunner.run(taskMock.address, calldata, gasLimit)).to.be.revertedWith('run: task not enabled')
    })

    it('should revert if balance is insufficient', async () => {
      const chainJetRunner = await deployChainJetRunner()
      const taskMock = await deployTaskMock(alice)
      await chainJetRunner.connect(alice).enableTask(taskMock.address, { value: 100 })
      const calldata = taskMock.interface.encodeFunctionData('run', [2])

      await expect(chainJetRunner.run(taskMock.address, calldata, gasLimit)).to.be.revertedWith(
        'run: insufficient balance',
      )
    })
  })
})
