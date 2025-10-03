import { useEffect, useState } from 'react';

const CACHE_KEY = 'crazycube:graveyard:has';
const TTL = 60 * 1000; // 1 min

export function useGraveyardAvailability() {
  const [has, setHas] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cachedRaw =
      typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as { ts: number; has: boolean };
      if (Date.now() - cached.ts < TTL) {
        setHas(cached.has);
      }
    }
    const fetchIt = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/ledger/graveyard');
        if (!res.ok) throw new Error('status');
        const data = (await res.json()) as { tokens: string[] };
        let hasTokens = data.tokens.length > 0;
        // sanity check: if ledger says >0, verify via live contract scan
        if (hasTokens) {
          try {
            const live = await fetch('/api/graveyard/tokens');
            if (live.ok) {
              const d2 = (await live.json()) as { tokens: string[] };
              hasTokens = d2.tokens.length > 0;
            }
          } catch {}
        }
        setHas(hasTokens);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), has: hasTokens })
        );
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchIt();
  }, []);

  return { has, loading };
}
