
import { useAccount, useReadContract, useWriteContract, useReadContracts } from 'wagmi';
import { coreContractConfig, nftContractConfig } from '@/lib/contracts';
import { useMemo } from 'react';
import { useSimpleToast } from '@/components/simple-toast';

type CoreMetaResult = readonly [
    unknown,
    unknown,
    unknown,
    boolean,
    ...unknown[]
];

type CoreStateResult = readonly [
    unknown,
    unknown,
    boolean,
    unknown,
    bigint,
    ...unknown[]
];

// 1. Hook to get all NFTs for the connected player
export function useGetPlayerNfts() {
    const { address } = useAccount();

    const { data: balance, isLoading: isBalanceLoading } = useReadContract({
        ...nftContractConfig,
        functionName: 'balanceOf',
        args: [address!],
        query: {
            enabled: !!address,
        },
    });

    const { data: tokenIds, isLoading: isTokenIdsLoading } = useReadContracts({
        contracts: Array.from({ length: Number(balance || 0) }).map((_, index) => ({
            ...nftContractConfig,
            functionName: 'tokenOfOwnerByIndex',
            args: [address!, index],
        })),
        query: {
            enabled: !!address && !!balance && Number(balance) > 0,
        },
    });

    return {
        tokenIds: tokenIds?.map(result => result.result) || [],
        isLoading: isBalanceLoading || isTokenIdsLoading,
    };
}

// 2. Hook to get details for a single NFT
export function useGetNftDetails(tokenId: bigint | number) {
    const tokenIdBigInt = typeof tokenId === 'bigint' ? tokenId : BigInt(tokenId);
    const { data, isLoading, error } = useReadContracts({
        contracts: [
            {
                ...coreContractConfig,
                functionName: 'meta',
                args: [tokenIdBigInt],
            },
            {
                ...coreContractConfig,
                functionName: 'state',
                args: [tokenIdBigInt],
            },
        ],
        query: {
            enabled: tokenIdBigInt !== undefined,
        }
    });

    const meta = data?.[0].result as CoreMetaResult | undefined;
    const state = data?.[1].result as CoreStateResult | undefined;

    return { meta, state, isLoading, error };
}

// 3. Hook for the ping write function
export function usePing() {
    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { toast } = useSimpleToast();

    const ping = (tokenId: bigint | number) => {
        const tokenIdBigInt = typeof tokenId === 'bigint' ? tokenId : BigInt(tokenId);
        writeContract({
            ...coreContractConfig,
            functionName: 'ping',
            args: [tokenIdBigInt],
        }, {
            onSuccess: () => {
                toast({
                    title: 'Ping successful!',
                    description: `Transaction sent for NFT #${tokenId}.`,
                });
            },
            onError: (err) => {
                toast({
                    title: 'Ping failed',
                    description: err.message,
                    variant: 'destructive',
                });
            }
        });
    };

    return { hash, error, isPending, ping };
}

// 4. Helper hook to determine if an NFT is pingable
export function usePingability(tokenId: bigint | number) {
    const tokenIdBigInt = typeof tokenId === 'bigint' ? tokenId : BigInt(tokenId);
    const { state, meta, isLoading: isDetailsLoading } = useGetNftDetails(tokenIdBigInt);

    const { data: pingInterval, isLoading: isIntervalLoading } = useReadContract({
        ...coreContractConfig,
        functionName: 'pingInterval',
    });

    const isPingable = useMemo(() => {
        if (!state || !meta || !pingInterval) return false;

        const lastPingTime = Number(state[4]); // lastPingTime is at index 4 in the state struct
        const now = Math.floor(Date.now() / 1000);

        return (
            meta[3] && // isActivated
            !state[2] && // !isInGraveyard
            now >= lastPingTime + Number(pingInterval)
        );
    }, [state, meta, pingInterval]);

    return {
        isPingable,
        isLoading: isDetailsLoading || isIntervalLoading,
    };
}
