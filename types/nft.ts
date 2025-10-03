export interface NFT {
  id: string;
  tokenId: number;
  name: string;
  image: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  rewardBalance: number;
  stars?: number;
  frozen: boolean;
  isInGraveyard?: boolean;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
}

export interface NFTStats {
  totalSupply: number;
  burnedCount: number;
  mintedCount: number;
  inGraveyard: number;
  burned24h: number;
  minted24h: number;
  bridged24h: number;
  rewardPool: string;
  monthlyUnlock: string;
  totalValueLocked: string;
  holders: number;
}

export interface UserNFTStats {
  totalOwned: number;
  totalFrozen: number;
  totalRewards: number;
  estimatedValue: string;
}
