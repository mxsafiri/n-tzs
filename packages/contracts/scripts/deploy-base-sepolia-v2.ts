import path from 'path'
import dotenv from 'dotenv'
import hre from 'hardhat'

dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local'), override: true })

async function main() {
  const safeAdmin = process.env.NTZS_SAFE_ADMIN

  if (!safeAdmin) {
    throw new Error('Missing env var: NTZS_SAFE_ADMIN')
  }

  const { ethers } = hre
  const upgrades = (hre as any).upgrades

  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', await deployer.getAddress())

  const NTZSV2 = await ethers.getContractFactory('NTZSV2')

  const proxy: any = await upgrades.deployProxy(NTZSV2, [safeAdmin], {
    kind: 'uups',
    initializer: 'initialize',
    unsafeAllow: ['constructor'],
  })
  await proxy.waitForDeployment()

  const proxyAddress = await proxy.getAddress()
  console.log('NTZSV2 (proxy) deployed to:', proxyAddress)

  console.log('Done.')
  console.log('Set this in env: NTZS_CONTRACT_ADDRESS_BASE_SEPOLIA=' + proxyAddress)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
