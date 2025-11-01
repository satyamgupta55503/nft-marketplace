import { useContext, useEffect, useState } from 'react'
import NFTCardList from '../src/components/organisms/NFTCardList'
import { Web3Context } from '../src/components/providers/Web3Provider'
import { LinearProgress } from '@mui/material'
import UnsupportedChain from '../src/components/molecules/UnsupportedChain'
import { mapAvailableMarketItems } from '../src/utils/nft'

export default function Home () {
  const [nfts, setNfts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { marketplaceContract, nftContract, isReady, network } = useContext(Web3Context)

  useEffect(() => {
    if (isReady && marketplaceContract && nftContract) {
      loadNFTs()
    }
  }, [isReady, marketplaceContract, nftContract])

  async function loadNFTs () {
    try {
      if (!isReady || !marketplaceContract || !nftContract) return
      setIsLoading(true)
      const data = await marketplaceContract.fetchAvailableMarketItems()
      const items = await Promise.all(data.map(mapAvailableMarketItems(nftContract)))
      setNfts(items)
    } catch (err) {
      console.error('Error loading NFTs:', err)
      setNfts([])
    } finally {
      setIsLoading(false)
    }
  }

  if (!network) return <UnsupportedChain />
  if (isLoading) return <LinearProgress />
  if (!isLoading && !nfts.length) return <h1>No NFTs for sale</h1>

  return (
    <NFTCardList nfts={nfts} setNfts={setNfts} withCreateNFT={false} />
  )
}
