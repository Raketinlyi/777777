// Lightweight fetch wrapper with exponential back-off + AbortSignal support
// Can be reused both in Next.js API routes (edge/server) and client code.

export interface FetchRetryOptions extends RequestInit {
  /** How many attempts (default 3) */
  retries?: number;
  /** Base back-off delay in ms (default 300) */
  retryDelayMs?: number;
  /** AbortController signal */
  signal?: AbortSignal;
}

/**
 * fetchWithRetry performs fetch with simple exponential back-off (2^n).
 * Fails fast on 4xx except 429. Retries on network errors / 5xx / 429.
 */
export async function fetchWithRetry(
  url: string,
  { retries = 3, retryDelayMs = 300, signal, ...init }: FetchRetryOptions = {}
): Promise<Response> {
  let attempt = 0;
  let lastErr: Error | null = null;

  while (attempt <= retries) {
    try {
      const fetchOptions = { ...init } as RequestInit;
      if (signal) {
        fetchOptions.signal = signal;
      }
      const res = await fetch(url, fetchOptions);
      if (res.ok) return res;

      // Do not retry for other 4xx (except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res;
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }

    if (attempt === retries) break;
    const delay = retryDelayMs * 2 ** attempt;
    await new Promise(r => setTimeout(r, delay));
    attempt++;
  }
  throw lastErr;
}
