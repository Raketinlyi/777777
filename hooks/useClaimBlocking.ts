import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

const CLAIM_BLOCK_KEY = 'crazycube:claimSectionBlocked';
import { useChainId } from 'wagmi';
const BLOCK_DURATION = 30 * 1000; // 30 seconds

export const useClaimBlocking = () => {
  const chainIdFromHook = useChainId();
  const chainId = (typeof window !== 'undefined' ? (window as any).ethereum?.chainId : undefined) || chainIdFromHook || undefined;
  const { address } = useAccount();
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Check if claim section is blocked
  const checkBlockStatus = () => {
    if (typeof window === 'undefined' || !address) return { isBlocked: false, timeLeft: 0 };
    
    try {
      const stored = localStorage.getItem(`${CLAIM_BLOCK_KEY}:${chainId || 'unknown'}`);
      if (!stored) return { isBlocked: false, timeLeft: 0 };
      
      const blockData = JSON.parse(stored);
      
      // Validate blockData structure
      if (!blockData || typeof blockData !== 'object' || !blockData.blockedUntil) {
        localStorage.removeItem(`${CLAIM_BLOCK_KEY}:${chainId || 'unknown'}`);
        return { isBlocked: false, timeLeft: 0 };
      }
      
      const now = Date.now();
      const timeRemaining = blockData.blockedUntil - now;
      
      if (timeRemaining > 0) {
        return { isBlocked: true, timeLeft: Math.ceil(timeRemaining / 1000) };
      } else {
        // Block expired, remove it
        localStorage.removeItem(`${CLAIM_BLOCK_KEY}:${chainId || 'unknown'}`);
        return { isBlocked: false, timeLeft: 0 };
      }
    } catch (error) {
      // Clean up corrupted data
      localStorage.removeItem(`${CLAIM_BLOCK_KEY}:${chainId || 'unknown'}`);
      return { isBlocked: false, timeLeft: 0 };
    }
  };

  // Block the claim section for 4 minutes
  const blockClaimSection = () => {
    if (typeof window === 'undefined' || !address) return;
    
    try {
      const blockData = {
        blockedAt: Date.now(),
        blockedUntil: Date.now() + BLOCK_DURATION,
        address: address
      };
      
      localStorage.setItem(`${CLAIM_BLOCK_KEY}:${chainId || 'unknown'}`, JSON.stringify(blockData));
      setIsBlocked(true);
      setTimeLeft(30); // 30 seconds
      } catch (error) {
      }
  };

  // Update block status and time remaining
  useEffect(() => {
    const updateStatus = () => {
      const status = checkBlockStatus();
      setIsBlocked(status.isBlocked);
      setTimeLeft(status.timeLeft);
    };

    // Check immediately
    updateStatus();

    // Update every second
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [address]);

  return {
    isBlocked,
    timeLeft,
    blockClaimSection,
    checkBlockStatus
  };
};