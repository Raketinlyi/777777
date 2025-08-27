// components/CrazyCubeInteraction.tsx
'use client'; // Directive for client components in Next.js App Router

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useCrazyCubeUltimate } from '../hooks/useCrazyCubeUltimate';
// import { formatEther } from 'viem'; // For formatting big numbers if needed. Uncomment if you plan to use.

export function CrazyCubeInteraction() {
  const { address: accountAddress, isConnected, chain } = useAccount();
  const {
    totalSupply,
    isLoadingTotalSupply,
    errorTotalSupply,
    refetchTotalSupply,
    balanceOf,
    isLoadingBalanceOf,
    errorBalanceOf,
    refetchBalanceOf,
    burnNFT,
    activateNFT,
    isSubmittingTx,
    isConfirmingTx,
    isTxConfirmed,
    hash,
    writeContractError,
    txConfirmationError,
  } = useCrazyCubeUltimate();

  const [tokenIdToBurn, setTokenIdToBurn] = useState('');
  const [tokenIdToActivate, setTokenIdToActivate] = useState('');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (hash) {
      setLastTxHash(hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isTxConfirmed && lastTxHash) {
      alert(`Transaction ${lastTxHash} confirmed!`);
      refetchTotalSupply(); // Update data after successful transaction
      refetchBalanceOf();
      setLastTxHash(null); // Reset hash after confirmation
    }
  }, [isTxConfirmed, lastTxHash, refetchTotalSupply, refetchBalanceOf]);

  const handleBurn = async () => {
    if (!tokenIdToBurn) {
      alert('Please enter token ID to burn.');
      return;
    }
    try {
      await burnNFT(BigInt(tokenIdToBurn));
      setTokenIdToBurn(''); // Clear input field
    } catch {
      // Errors are already handled and displayed via alert in the hook
    }
  };

  const handleActivate = async () => {
    if (!tokenIdToActivate) {
      alert('Please enter token ID to activate.');
      return;
    }
    try {
      await activateNFT(BigInt(tokenIdToActivate));
      setTokenIdToActivate(''); // Clear input field
    } catch {
      // Errors are already handled and displayed via alert in the hook
    }
  };

  if (!isConnected) {
    return <p>Please connect your wallet.</p>;
  }

  // Check that user is connected to the desired chain (ApeChain)
  // To enable, import MAIN_CHAIN_ID from '../config/wagmi'
  // if (chain?.id !== MAIN_CHAIN_ID) {
  //   return <p>Please switch to ApeChain network in your wallet.</p>;
  // }

  return (
    <div
      style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0' }}
    >
      <h2>Test interaction with CrazyCubeUltimate</h2>
      <p>
        <strong>Your address:</strong> {accountAddress}
      </p>
      <p>
        <strong>Network:</strong> {chain?.name} (ID: {chain?.id})
      </p>

      <div style={{ marginBottom: '15px' }}>
        <h3>Contract information:</h3>
        {isLoadingTotalSupply && <p>Loading total NFT supply...</p>}
        {totalSupply !== undefined && totalSupply !== null && (
          <p>
            <strong>Total NFT supply:</strong> {totalSupply.toString()}
          </p>
        )}
        {errorTotalSupply && (
          <p style={{ color: 'red' }}>
            Error loading totalSupply: {errorTotalSupply.message}
          </p>
        )}
        <button
          onClick={() => refetchTotalSupply()}
          disabled={isLoadingTotalSupply}
        >
          {isLoadingTotalSupply ? 'Updating...' : 'Refresh Total Supply'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        {isLoadingBalanceOf && <p>Loading your NFT balance...</p>}
        {balanceOf !== undefined && balanceOf !== null && (
          <p>
            <strong>Your NFT balance:</strong> {balanceOf.toString()}
          </p>
        )}
        {errorBalanceOf && (
          <p style={{ color: 'red' }}>
            Error loading balanceOf: {errorBalanceOf.message}
          </p>
        )}
        <button
          onClick={() => refetchBalanceOf()}
          disabled={isLoadingBalanceOf}
        >
          {isLoadingBalanceOf ? 'Updating...' : 'Refresh my balance'}
        </button>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <div style={{ marginBottom: '15px' }}>
        <h3>Burn NFT:</h3>
        <input
          type='number'
          value={tokenIdToBurn}
          onChange={e => setTokenIdToBurn(e.target.value)}
          placeholder='Token ID to burn'
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button
          onClick={handleBurn}
          disabled={isSubmittingTx || isConfirmingTx}
        >
          {isSubmittingTx
            ? 'Submitting...'
            : isConfirmingTx
              ? 'Confirming...'
              : 'Burn NFT'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <h3>Activate NFT:</h3>
        <input
          type='number'
          value={tokenIdToActivate}
          onChange={e => setTokenIdToActivate(e.target.value)}
          placeholder='Token ID to activate'
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button
          onClick={handleActivate}
          disabled={isSubmittingTx || isConfirmingTx}
        >
          {isSubmittingTx
            ? 'Submitting...'
            : isConfirmingTx
              ? 'Confirming...'
              : 'Activate NFT'}
        </button>
      </div>

      {lastTxHash && (
        <p>
          <strong>Last transaction hash:</strong>{' '}
          <a
            href={`https://apescan.io/tx/${lastTxHash}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            {lastTxHash}
          </a>
        </p>
      )}
      {writeContractError && (
        <p style={{ color: 'red' }}>
          <strong>Transaction send error:</strong> {writeContractError.message}
        </p>
      )}
      {txConfirmationError && (
        <p style={{ color: 'red' }}>
          <strong>Transaction confirmation error:</strong>{' '}
          {txConfirmationError.message}
        </p>
      )}
      {/* Removed duplicate message because alert is already in useEffect */}
    </div>
  );
}
