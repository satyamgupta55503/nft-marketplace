const fs = require('fs')
const path = require('path')
const hre = require('hardhat')

async function main () {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying contracts with:', deployer.address)

  const NFT = await hre.ethers.getContractFactory('NFT')
  const nft = await NFT.deploy()
  await nft.deployed()
  console.log('NFT deployed to:', nft.address)

  const Market = await hre.ethers.getContractFactory('Marketplace')
  const market = await Market.deploy()
  await market.deployed()
  console.log('Marketplace deployed to:', market.address)

  const addressesDir = path.join(__dirname, '../addresses')
  if (!fs.existsSync(addressesDir)) fs.mkdirSync(addressesDir)

  const network = hre.network.name.toUpperCase() === 'LOCALHOST' ? 'LOCALHOST' : 'MUMBAI'
  const data = {
    network,
    nftAddress: nft.address,
    marketplaceAddress: market.address
  }

  fs.writeFileSync(`${addressesDir}/${network}.json`, JSON.stringify(data, null, 2))
  console.log('Saved deployment info to addresses directory.')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
