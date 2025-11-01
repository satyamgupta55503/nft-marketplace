import { createContext, useEffect, useState } from 'react'
import Web3Modal from 'web3modal'
import { ethers } from 'ethers'
import NFT from '../../../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../../../artifacts/contracts/Marketplace.sol/Marketplace.json'
import axios from 'axios'

const contextDefaultValues = {
  account: '',
  network: 'unknown',
  balance: 0,
  connectWallet: () => {},
  marketplaceContract: null,
  nftContract: null,
  isReady: false,
  hasWeb3: false
}

const networkMap = {
  maticmum: 'MUMBAI',
  localhost: 'LOCALHOST',
  hardhat: 'LOCALHOST'
}

export const Web3Context = createContext(contextDefaultValues)

export default function Web3Provider ({ children }) {
  const [hasWeb3, setHasWeb3] = useState(false)
  const [account, setAccount] = useState('')
  const [network, setNetwork] = useState('unknown')
  const [balance, setBalance] = useState(0)
  const [marketplaceContract, setMarketplaceContract] = useState(null)
  const [nftContract, setNFTContract] = useState(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    initializeWeb3()
  }, [])

  async function initializeWeb3WithoutSigner () {
    try {
      const provider = new ethers.providers.AlchemyProvider('maticmum')
      setHasWeb3(false)
      await setupContracts(provider, 'MUMBAI')
      setIsReady(true)
    } catch (err) {
      console.error('Error initializing without signer:', err)
    }
  }

  async function initializeWeb3 () {
    try {
      if (!window.ethereum) {
        await initializeWeb3WithoutSigner()
        return
      }

      const web3Modal = new Web3Modal()
      const connection = await web3Modal.connect()
      const provider = new ethers.providers.Web3Provider(connection, 'any')
      setHasWeb3(true)

      await getAndSetWeb3Context(provider)

      connection.on('accountsChanged', () => getAndSetWeb3Context(provider))
      connection.on('chainChanged', () => getAndSetWeb3Context(provider))
    } catch (error) {
      console.error('Web3 initialization error:', error)
      await initializeWeb3WithoutSigner()
    }
  }

  async function getAndSetWeb3Context (provider) {
    try {
      setIsReady(false)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)

      const { name } = await provider.getNetwork()
      const netName = networkMap[name] || 'LOCALHOST'
      setNetwork(netName)

      const balance = await provider.getBalance(address)
      setBalance(ethers.utils.formatEther(balance))

      await setupContracts(signer, netName)
      setIsReady(true)
    } catch (err) {
      console.error('Error setting web3 context:', err)
    }
  }

  async function setupContracts (signerOrProvider, networkName) {
    try {
      const { data } = await axios.get(`/api/addresses?network=${networkName}`)
      const { marketplaceAddress, nftAddress } = data

      if (!marketplaceAddress || !nftAddress) {
        console.error('Missing contract addresses in API response.')
        setMarketplaceContract(null)
        setNFTContract(null)
        return
      }

      const marketplace = new ethers.Contract(marketplaceAddress, Market.abi, signerOrProvider)
      const nft = new ethers.Contract(nftAddress, NFT.abi, signerOrProvider)

      setMarketplaceContract(marketplace)
      setNFTContract(nft)
    } catch (err) {
      console.error('Error setting up contracts:', err)
      setMarketplaceContract(null)
      setNFTContract(null)
    }
  }

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        network,
        hasWeb3,
        isReady,
        marketplaceContract,
        nftContract,
        initializeWeb3
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
