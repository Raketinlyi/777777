'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function MarketTicker() {
  const { data, error } = useSWR('/api/market/prices', fetcher, {
    refreshInterval: 60000,
  });

  // Until we have full ticker UI ‑ don't render to avoid empty pink stripe
  if (!data || error || data.error) return null;

  // TODO: Implement scrolling ticker with market highlights
  return null;
}
